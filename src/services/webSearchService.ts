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

        // 2. Summary (Abstract)
        let summary = data.Abstract || data.AbstractText || '';

        // 3. Source
        const source = data.AbstractSource || 'DuckDuckGo';

        // 4. Related Links
        const related: Array<{ text: string; url: string }> = [];
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            data.RelatedTopics.forEach((topic: any) => {
                if (topic.Text && topic.FirstURL) {
                    related.push({
                        text: topic.Text,
                        url: topic.FirstURL
                    });
                }
            });
        }

        // Fallback Logic
        if (!summary) {
            // If no abstract, try to use the first related topic as summary
            if (related.length > 0) {
                summary = related[0].text;
                // Remove the used topic from related list so it's not duplicated
                // related.shift(); 
            } else {
                summary = "Search completed but returned no direct summary context.";
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
 * Formats results into a concise string for LLM context
 */
export function formatResultsForPrompt(query: string, result: WebSearchResult): string {
    let context = `WEB SEARCH RESULTS for "${query}":\n`;
    context += `SUMMARY: ${result.summary}\n\n`;

    if (result.related.length > 0) {
        context += `RELATED SOURCES:\n`;
        result.related.slice(0, 5).forEach(link => {
            context += `- ${link.text}: ${link.url}\n`;
        });
    }

    context += `\nINSTRUCTIONS: Use the above information as grounding context to answer the user query. Reference links if necessary. If the search results don't contain enough information, use your internal knowledge to provide a complete answer.`;

    return context;
}
