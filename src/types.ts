// Types for NexusAI Dashboard
import type { SystemPromptMode } from './systemPrompts';

export interface Provider {
    id: string;
    name: string;
    icon: string;
    color: string;
    baseUrl: string;
}

export interface Model {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
}

export interface Message {
    id: string;
    chatId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    webResult?: WebSearchResult;
    pdfUrl?: string;
}

export type SearchMode = 'ai' | 'web';

export interface WebSearchResult {
    type: 'web';
    title: string;
    summary: string;
    source: string;
    related: Array<{
        text: string;
        url: string;
    }>;
}

export interface Chat {
    id: string;
    title: string;
    providerId: string;
    modelId: string;
    memoryEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Memory {
    id: string;
    type: 'user_profile' | 'preference' | 'fact';
    title: string;
    content: string;
    enabled: boolean;
    createdAt: string;
}

export interface AppState {
    // Auth & Keys
    apiKeys: Record<string, string>;

    // Provider & Model
    providers: Provider[];
    currentProviderId: string | null;
    currentModelId: string | null;
    availableModels: Model[];
    isLoadingModels: boolean;

    // System Prompt
    promptMode: SystemPromptMode;
    searchMode: SearchMode;

    // Chat
    chats: Chat[];
    currentChatId: string | null;
    messages: Message[];

    // Memory
    memories: Memory[];
    memoryEnabled: boolean;

    // UI
    view: 'welcome' | 'chat' | 'settings' | 'models';
    modalOpen: 'none' | 'apiKey' | 'memory' | 'addMemory' | 'settings';
    sidebarOpen: boolean;
    isStreaming: boolean;
    isSearching: boolean;
    streamingContent: string;
}

export interface StreamChunk {
    content: string;
    done: boolean;
    error?: string;
}

export type StateListener = (state: AppState, prevState: AppState) => void;
