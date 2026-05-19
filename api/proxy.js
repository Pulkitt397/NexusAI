export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    
    // Construct the destination URL
    let targetBase = '';
    if (provider === 'gemini') {
        targetBase = 'https://generativelanguage.googleapis.com';
    } else if (provider === 'groq') {
        targetBase = 'https://api.groq.com';
    } else if (provider === 'openrouter') {
        targetBase = 'https://openrouter.ai';
    } else if (provider === 'huggingface') {
        targetBase = 'https://api-inference.huggingface.co';
    } else if (provider === 'huggingface-api') {
        targetBase = 'https://huggingface.co';
    } else if (provider === 'zai') {
        targetBase = 'https://api.z.ai';
    } else if (provider === 'nvidia') {
        targetBase = 'https://integrate.api.nvidia.com/v1';
    } else if (provider === 'ollama') {
        targetBase = 'https://ollama.com';
    }

    if (!targetBase) {
        return new Response(JSON.stringify({ error: { message: 'Invalid provider' } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Reconstruct the full destination URL.
    // Preserve the original path after the provider and keep search parameters (like ?key= or ?alt=sse)
    const reqPath = url.pathname.replace(`/api/${provider}`, '');
    const targetUrl = new URL(reqPath + url.search, targetBase);
    
    // Remove proxy-specific search params from targetUrl
    targetUrl.searchParams.delete('provider');
    targetUrl.searchParams.delete('path');

    // Copy original request headers, override Host
    const headers = new Headers(req.headers);
    headers.set('Host', targetUrl.host);
    
    // Clean up Vercel/Connection headers to prevent interference
    headers.delete('connection');
    headers.delete('host');
    
    try {
        const isBodyMethod = req.method !== 'GET' && req.method !== 'HEAD';
        const res = await fetch(targetUrl.toString(), {
            method: req.method,
            headers,
            body: isBodyMethod ? req.body : undefined,
            ...(isBodyMethod ? { duplex: 'half' } : {}),
        });

        // Copy and stream headers/body back to client
        return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
        });
    } catch (error) {
        console.error('Edge Proxy Error:', error);
        return new Response(JSON.stringify({ error: { message: error.message || 'Edge proxy error' } }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
