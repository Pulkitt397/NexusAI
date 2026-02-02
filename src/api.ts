// API Layer - Provider integrations with streaming
import type { Model, StreamChunk } from './types';
import { store } from './store';

// Gemini API
export async function fetchGeminiModels(apiKey: string): Promise<Model[]> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error('Failed to fetch Gemini models');
    const data = await res.json();

    return (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
            id: m.name.replace('models/', ''),
            name: formatModelName(m.name.replace('models/', '')),
            contextLength: m.inputTokenLimit
        }))
        .sort((a: Model, b: Model) => {
            if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
            if (!a.id.includes('flash') && b.id.includes('flash')) return 1;
            return a.name.localeCompare(b.name);
        });
}

export async function* streamGemini(apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const body: any = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } };
    if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Gemini API error');
    yield* parseSSE(res);
}

// Groq API
export async function fetchGroqModels(apiKey: string): Promise<Model[]> {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error('Failed to fetch Groq models');
    const data = await res.json();

    return (data.data || [])
        .filter((m: any) => !m.id.includes('whisper'))
        .map((m: any) => ({
            id: m.id,
            name: formatModelName(m.id),
            contextLength: m.context_window
        }));
}

export async function* streamGroq(apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 8192 })
    });

    if (!res.ok) throw new Error('Groq API error');
    yield* parseOpenAISSE(res);
}

// OpenRouter API
export async function fetchOpenRouterModels(apiKey: string): Promise<Model[]> {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error('Failed to fetch OpenRouter models');
    const data = await res.json();

    return (data.data || [])
        .filter((m: any) => m.context_length)
        .slice(0, 50)
        .map((m: any) => ({
            id: m.id,
            name: m.name || formatModelName(m.id),
            contextLength: m.context_length
        }));
}

export async function* streamOpenRouter(apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NexusAI'
        },
        body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 4096 })
    });

    if (!res.ok) throw new Error('OpenRouter API error');
    yield* parseOpenAISSE(res);
}

// Universal functions
export async function fetchModels(providerId: string, apiKey: string): Promise<Model[]> {
    switch (providerId) {
        case 'gemini': return fetchGeminiModels(apiKey);
        case 'groq': return fetchGroqModels(apiKey);
        case 'openrouter': return fetchOpenRouterModels(apiKey);
        default: throw new Error('Unknown provider');
    }
}

export async function* streamChat(providerId: string, apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    switch (providerId) {
        case 'gemini': yield* streamGemini(apiKey, model, messages, systemPrompt); break;
        case 'groq': yield* streamGroq(apiKey, model, messages, systemPrompt); break;
        case 'openrouter': yield* streamOpenRouter(apiKey, model, messages, systemPrompt); break;
        default: throw new Error('Unknown provider');
    }
}

// SSE Parsers
async function* parseSSE(res: Response): AsyncGenerator<StreamChunk> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const json = line.slice(6).trim();
                if (json && json !== '[DONE]') {
                    try {
                        const data = JSON.parse(json);
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield { content: text, done: false };
                        if (data.candidates?.[0]?.finishReason) yield { content: '', done: true };
                    } catch { }
                }
            }
        }
    }
}

async function* parseOpenAISSE(res: Response): AsyncGenerator<StreamChunk> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const json = line.slice(6).trim();
                if (json && json !== '[DONE]') {
                    try {
                        const data = JSON.parse(json);
                        const text = data.choices?.[0]?.delta?.content;
                        if (text) yield { content: text, done: false };
                        if (data.choices?.[0]?.finish_reason) yield { content: '', done: true };
                    } catch { }
                }
            }
        }
    }
}

function formatModelName(id: string): string {
    const map: Record<string, string> = {
        'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
        'gemini-1.5-flash': 'Gemini 1.5 Flash',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'llama-3.3-70b-versatile': 'Llama 3.3 70B',
        'mixtral-8x7b-32768': 'Mixtral 8x7B'
    };
    return map[id] || id.split(/[-\/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
