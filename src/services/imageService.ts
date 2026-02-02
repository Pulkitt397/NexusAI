// Image Service for Nexus AI
// Handles resolving "search:" URLs into actual image URLs
// Currently uses Pollinations.ai for instant, high-quality AI image generation as a proxy for "search"
// This allows the prototype to work immediately without API keys.

const FALLBACK_PROVIDER = 'pollinations';

export interface ImageResult {
    url: string;
    caption?: string;
    source: string;
}

export const resolveImageSearch = async (query: string): Promise<ImageResult> => {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    // Clean query
    // Remove "search:" or "https://nexus-asset.local/image/"
    const cleanQuery = query
        .replace(/^search:/, '')
        .replace(/^https:\/\/nexus-asset\.local\/image\//, '')
        .replace(/\+/g, ' ') // Convert URL encoded spaces if strictly encoded
        .trim();
    const encoded = encodeURIComponent(cleanQuery);

    // In a real production app, this would call Unsplash/Pexels API
    // For this "v0" environment, we use Pollinations to GENERATE the asset on demand
    // This creates a "perfect" match for the UI every time.

    // We add 'highly detailed, 8k, professional photography' to ensures high quality assets
    const refinedPrompt = `${cleanQuery}, highly detailed, professional photography, 4k`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(refinedPrompt)}?nolog=true&width=1024&height=600&seed=${Math.floor(Math.random() * 1000)}`;

    return {
        url,
        caption: cleanQuery,
        source: 'AI Generated Asset'
    };
};
