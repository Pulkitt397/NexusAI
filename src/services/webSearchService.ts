import { WebSearchResult } from '@/types';

const DDG_API_URL = 'https://api.duckduckgo.com/';

/**
 * Searches DuckDuckGo Instant Answer API and normalizes the response.
 * Acts as the "Backend" logic for web search.
 */
export async function searchWeb(query: string): Promise<WebSearchResult> {
    try {
        const url = new URL(DDG_API_URL);
        url.searchParams.append('q', query);
        url.searchParams.append('format', 'json');
        url.searchParams.append('no_redirect', '1');
        url.searchParams.append('no_html', '1');
        url.searchParams.append('t', 'nexusai'); // App identifier

        // Note: Direct browser calls to DDG API might face CORS issues.
        // In a real production app with a backend, we'd proxy this.
        // For this CSR app, we'll try direct fetch. If it fails, we catch it.
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`DuckDuckGo API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Normalize Data

        // 1. Title
        const title = data.Heading || query;

        // 2. Summary (Abstract or Answer)
        let summary = data.Answer || data.Abstract || data.AbstractText || '';

        // 3. Source
        const source = data.AbstractSource || (data.Answer ? 'DuckDuckGo Answer' : 'DuckDuckGo');

        // 4. Related Links
        const related: Array<{ text: string; url: string }> = [];
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            data.RelatedTopics.forEach((topic: any) => {
                if (topic.Text && topic.FirstURL) {
                    related.push({
                        text: topic.Text,
                        url: topic.FirstURL
                    });
                } else if (topic.Topics && Array.isArray(topic.Topics)) {
                    // Handle nested topics
                    topic.Topics.forEach((subTopic: any) => {
                        if (subTopic.Text && subTopic.FirstURL) {
                            related.push({ text: subTopic.Text, url: subTopic.FirstURL });
                        }
                    });
                }
            });
        }

        // Fallback Logic
        if (!summary) {
            // If no abstract, try to use the first related topic as summary
            if (related.length > 0) {
                summary = related[0].text;
            } else {
                summary = "The search query did not yield a direct summary. Please rely on authoritative internal knowledge while acknowledging the current temporal grounding if provided.";
            }
        }

        return {
            type: 'web',
            title,
            summary,
            source,
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
