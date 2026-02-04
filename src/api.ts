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
        body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 8192 })
    });

    if (!res.ok) throw new Error('OpenRouter API error');
    yield* parseOpenAISSE(res);
}

// Hugging Face API
export async function fetchHuggingFaceModels(apiKey: string): Promise<Model[]> {
    // Verify the API key by making a simple request
    const verifyRes = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!verifyRes.ok) throw new Error('Invalid Hugging Face API key');

    // Fetch all text-generation models that are available for inference (free tier)
    const modelsRes = await fetch(
        'https://huggingface.co/api/models?pipeline_tag=text-generation&inference=warm&sort=downloads&direction=-1&limit=100',
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    if (!modelsRes.ok) throw new Error('Failed to fetch Hugging Face models');
    const modelsData = await modelsRes.json();

    // Also fetch conversational models
    const chatRes = await fetch(
        'https://huggingface.co/api/models?pipeline_tag=conversational&inference=warm&sort=downloads&direction=-1&limit=50',
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    let chatModels: any[] = [];
    if (chatRes.ok) {
        chatModels = await chatRes.json();
    }

    // Combine and deduplicate models
    const allModels = [...modelsData, ...chatModels];
    const seen = new Set<string>();
    const uniqueModels = allModels.filter((m: any) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
    });

    return uniqueModels.map((m: any) => ({
        id: m.id,
        name: formatModelName(m.id),
        description: m.pipeline_tag,
        contextLength: m.config?.max_position_embeddings || 4096
    }));
}

export async function* streamHuggingFace(apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;

    const res = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: msgs,
            stream: true,
            max_tokens: 4096,
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Hugging Face API error');
    }
    yield* parseOpenAISSE(res);
}

// NVIDIA Kimi API (OpenAI compatible)
export async function fetchNvidiaModels(apiKey: string): Promise<Model[]> {
    // Skip verification for NVIDIA to allow all keys (including trial/restricted keys)
    // We'll trust the key works for the chat endpoint

    // Comprehensive list of NVIDIA NIM models
    const models = [
        { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', description: '1T multimodal MoE', contextLength: 128000 },
        { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Meta Flagship Model', contextLength: 128000 },
        { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Meta High Performance', contextLength: 128000 },
        { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Meta Efficient', contextLength: 128000 },
        { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Llama 3.1 Nemotron 70B', description: 'NVIDIA Optimized Llama', contextLength: 128000 },
        { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2', description: 'Mistral Flagship', contextLength: 128000 },
        { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', description: 'High Performance MoE', contextLength: 64000 },
        { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Google Efficient', contextLength: 8192 },
        { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Google Small', contextLength: 8192 },
        { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', description: 'Reasoning Model', contextLength: 128000 },
        { id: 'microsoft/phi-3.5-mini-instruct', name: 'Phi 3.5 Mini', description: 'Microsoft Small', contextLength: 128000 },
        { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B', description: 'NVIDIA Foundation', contextLength: 4096 }
    ];

    return models;
}

export async function* streamNvidia(apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;

    const body: any = {
        model,
        messages: msgs,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7
    };

    // Special handling for Kimi K2.5
    if (model.includes('kimi')) {
        body.max_tokens = 16384;
        body.chat_template_kwargs = { thinking: true };
        body.top_p = 1.0;
    }

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error?.message || error.detail || 'NVIDIA API error');
    }
    yield* parseOpenAISSE(res);
}

// Universal functions
export async function fetchModels(providerId: string, apiKey: string): Promise<Model[]> {
    switch (providerId) {
        case 'gemini': return fetchGeminiModels(apiKey);
        case 'groq': return fetchGroqModels(apiKey);
        case 'openrouter': return fetchOpenRouterModels(apiKey);
        case 'huggingface': return fetchHuggingFaceModels(apiKey);
        case 'nvidia': return fetchNvidiaModels(apiKey);
        default: throw new Error('Unknown provider');
    }
}

export async function* streamChat(providerId: string, apiKey: string, model: string, messages: { role: string, content: string }[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    switch (providerId) {
        case 'gemini': yield* streamGemini(apiKey, model, messages, systemPrompt); break;
        case 'groq': yield* streamGroq(apiKey, model, messages, systemPrompt); break;
        case 'openrouter': yield* streamOpenRouter(apiKey, model, messages, systemPrompt); break;
        case 'huggingface': yield* streamHuggingFace(apiKey, model, messages, systemPrompt); break;
        case 'nvidia': yield* streamNvidia(apiKey, model, messages, systemPrompt); break;
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
        'deepseek-r1-distill-llama-70b': 'DeepSeek R1 70B',
        'llama-3.3-70b-versatile': 'Llama 3.3 70B',
        'mixtral-8x7b-32768': 'Mixtral 8x7B'
    };
    return map[id] || id.split(/[-\/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
