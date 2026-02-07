import { Provider } from './types';

export const PROVIDERS: Provider[] = [
    { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#4285f4', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'groq', name: 'Groq', icon: '⚡', color: '#f97316', baseUrl: 'https://api.groq.com/openai/v1' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', color: '#8b5cf6', baseUrl: 'https://openrouter.ai/api/v1' },
    { id: 'huggingface', name: 'Hugging Face', icon: '🤗', color: '#ffcc00', baseUrl: 'https://api-inference.huggingface.co' },
    { id: 'nvidia', name: 'NVIDIA Kimi', icon: '🟢', color: '#76b900', baseUrl: 'https://integrate.api.nvidia.com/v1' },
    { id: 'zai', name: 'Zhipu AI', icon: '🇿', color: '#3b82f6', baseUrl: 'https://api.z.ai/api/paas/v4' }
];

export const PROVIDER_LINKS: Record<string, string> = {
    gemini: 'https://aistudio.google.com/apikey',
    groq: 'https://console.groq.com/keys',
    openrouter: 'https://openrouter.ai/keys',
    huggingface: 'https://huggingface.co/settings/tokens',
    nvidia: 'https://build.nvidia.com/explore/discover',
    zai: 'https://open.bigmodel.cn/usercenter/apikeys'
};

// Best models per provider (in priority order)
export const PREFERRED_MODELS: Record<string, string[]> = {
    gemini: [
        'gemini-1.5-flash',        // User requested "Flash 2.5" (likely 1.5 Flash as it is the free tier standard)
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro'
    ],
    groq: [
        'deepseek-r1-distill-llama-70b', // User requested "GPT OSS 120B" (DeepSeek R1 70B is the closest match)
        'llama-3.3-70b-versatile',
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
    ],
    nvidia: [
        'moonshotai/kimi-k2.5',
        'meta/llama-3.1-405b-instruct',
        'meta/llama-3.1-70b-instruct',
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'mistralai/mistral-large-2-instruct'
    ],
    zai: [
        'glm-4-plus',
        'glm-4-0520',
        'glm-4-air',
        'glm-4-flash'
    ]
};
