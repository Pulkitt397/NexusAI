import { WebSearchResult } from '@/types';

const SEARX_API_URL = 'https://searx.be/search';

/**
 * Searches the SearXNG metasearch engine (searx.be) and normalizes organic results.
 * Acts as the "Backend" logic for web search.
 */
export async function searchWeb(query: string): Promise<WebSearchResult> {
    try {
        const url = new URL(SEARX_API_URL);
        url.searchParams.append('q', query);
        url.searchParams.append('format', 'json');

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`SearXNG API error: ${response.statusText}`);
        }

        const data = await response.json();

        // 1. Title
        const title = `Search Results for "${query}"`;

        // 2. Summary (Assemble organic result snippets)
        let summary = '';
        const related: Array<{ text: string; url: string }> = [];

        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            // Merge top 3 organic results to build a detailed summary for the LLM
            const topResults = data.results.slice(0, 3);
            summary = topResults
                .map((res: any, idx: number) => `[Source ${idx + 1}] "${res.title}": ${res.content || res.snippet || ''}`)
                .join('\n\n');

            // Populate related links
            data.results.forEach((res: any) => {
                if (res.title && res.url) {
                    related.push({
                        text: res.title,
                        url: res.url
                    });
                }
            });
        }

        // Fallback Logic
        if (!summary) {
            summary = "No real-time search results or organic summaries were found for this query.";
        }

        return {
            type: 'web',
            title,
            summary,
            source: 'SearXNG (searx.be)',
            related: related.slice(0, 5) // Limit to 5 related links
        };

    } catch (error) {
        console.error('Web Search Error:', error);
        return {
            type: 'web',
            title: 'Search unavailable',
            summary: 'The web search tool encountered a technical limitation (network/CORS).',
            source: 'System',
            related: []
        };
    }
}

/**
 * Formats results into a concise string for LLM context.
 * Implements strict authoritative verification for official data.
 */
export function formatResultsForPrompt(query: string, result: WebSearchResult): string {
    const isOfficialRequest = /\b(exam|timetable|result|schedule|notification|board|date|class-12|rbse|cbse|ssc|hsc)\b/i.test(query);

    let context = `CRITICAL GROUNDING CONTEXT for "${query}":\n`;
    context += `SEARCH SUMMARY: ${result.summary}\n\n`;

    if (result.related.length > 0) {
        context += `SOURCE LIST:\n`;
        result.related.slice(0, 5).forEach(link => {
            const isGov = /\.(gov\.in|nic\.in|edu\.in)\b/i.test(link.url);
            context += `- [${isGov ? 'AUTHORITATIVE' : 'THIRD-PARTY'}] ${link.text}: ${link.url}\n`;
        });
    }

    context += `\nSTRICT INSTRUCTIONS FOR OFFICIAL DATA:`;
    if (isOfficialRequest) {
        context += `
1. This query asks for OFFICIAL DATA (dates, results, schedules).
2. RULE: You may ONLY state dates if a source tagged [AUTHORITATIVE] or a known official board website confirms them.
3. RULE: If no [AUTHORITATIVE] source confirms the 2026 dates, you MUST use the following template:
   "The [Official Body] has not yet released the official [Item] for 2026. Based on previous years, it is usually published around [Month], but no dates are confirmed yet."
4. FORBIDDEN: Do not mention "tentative" or "expected" dates from THIRD-PARTY sites.
5. ZERO TOLERANCE for hallucinating timetables or days of the week.`;
    } else {
        context += `\nUse the above information as grounding context. If the results are insufficient, rely on your internal base knowledge but never state unverified facts as certainty.`;
    }

    return context;
}
