
/**
 * Service to generate asset URLs from prompts.
 * Uses Pollinations.ai for images (Free, No Key).
 */

export function generateImageUrl(prompt: string, width: number = 800, height: number = 600): string {
    const encodedPrompt = encodeURIComponent(prompt);
    // Add random seed to avoid caching identical prompts if needed, but Pollinations usually handles it.
    // Adding 'nologo' or similar might be useful if supported, but standard is fine.
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
}

export function generateIconKeyword(keyword: string): string {
    // Just a passthrough for now, but could map to specific Lucide icon names if we had a dictionary.
    return keyword.toLowerCase().replace(/\s+/g, '-');
}
