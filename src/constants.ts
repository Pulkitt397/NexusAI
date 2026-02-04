import { Provider } from './types';

export const PROVIDERS: Provider[] = [
    { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#4285f4', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'groq', name: 'Groq', icon: '⚡', color: '#f97316', baseUrl: 'https://api.groq.com/openai/v1' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', color: '#8b5cf6', baseUrl: 'https://openrouter.ai/api/v1' },
    { id: 'huggingface', name: 'Hugging Face', icon: '🤗', color: '#ffcc00', baseUrl: 'https://api-inference.huggingface.co' }
];

export const PROVIDER_LINKS: Record<string, string> = {
    gemini: 'https://aistudio.google.com/apikey',
    groq: 'https://console.groq.com/keys',
    openrouter: 'https://openrouter.ai/keys',
    huggingface: 'https://huggingface.co/settings/tokens'
};

// Best models per provider (in priority order)
export const PREFERRED_MODELS: Record<string, string[]> = {
    gemini: [
        'gemini-2.0-flash',        // Latest stable flash (if available)
        'gemini-2.0-flash-exp',    // Experimental flash
        'gemini-1.5-flash',        // Standard flash
        'gemini-1.5-pro'           // Pro model
    ],
    groq: [
        'deepseek-r1-distill-llama-70b', // DeepSeek R1 (High performance)
        'llama-3.3-70b-versatile',       // Llama 3.3
        'llama-3.1-70b-versatile',
        'mixtral-8x7b-32768'
    ],
    openrouter: [
        'anthropic/claude-3.5-sonnet',
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-flash-1.5'
    ],
    huggingface: [
        'mistralai/Mistral-7B-Instruct-v0.3',
        'Qwen/Qwen2.5-7B-Instruct',
        'google/gemma-2-9b-it',
        'meta-llama/Llama-3.2-3B-Instruct'
    ]
};
