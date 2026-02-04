// Reactive State Store with TypeScript
import type { AppState, StateListener, Provider, Memory } from './types';
import * as db from './db';

import { PROVIDERS } from './constants';

const initialState: AppState = {
    apiKeys: {},
    providers: PROVIDERS,
    currentProviderId: null,
    currentModelId: null,
    availableModels: [],
    isLoadingModels: false,
    promptMode: 'standard',
    searchMode: 'ai',
    chats: [],
    currentChatId: null,
    messages: [],
    memories: [],
    memoryEnabled: true,
    view: 'welcome',
    modalOpen: 'none',
    sidebarOpen: true,
    isStreaming: false,
    isSearching: false,
    streamingContent: ''
};

class Store {
    private state: AppState;
    private listeners: Set<StateListener> = new Set();

    constructor() {
        this.state = { ...initialState };
    }

    getState(): AppState {
        return this.state;
    }

    setState(updates: Partial<AppState>): void {
        const prev = this.state;
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(fn => fn(this.state, prev));
    }

    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export const store = new Store();

// Actions
export const actions = {
    setApiKey(providerId: string, key: string) {
        const apiKeys = { ...store.getState().apiKeys, [providerId]: key };
        store.setState({ apiKeys });
        localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
    },

    loadApiKeys() {
        try {
            const saved = localStorage.getItem('nexus_api_keys');
            if (saved) {
                store.setState({ apiKeys: JSON.parse(saved) });
            }
        } catch (e) {
            console.error('Failed to load API keys:', e);
        }
    },

    setProvider(providerId: string) {
        store.setState({
            currentProviderId: providerId,
            currentModelId: null,
            availableModels: [],
            isLoadingModels: true
        });
    },

    setModels(models: AppState['availableModels']) {
        store.setState({ availableModels: models, isLoadingModels: false });
        if (models.length > 0 && !store.getState().currentModelId) {
            store.setState({ currentModelId: models[0].id });
        }
    },

    setModel(modelId: string) {
        store.setState({ currentModelId: modelId });
    },

    setChats(chats: AppState['chats']) {
        store.setState({ chats });
    },

    addChat(chat: AppState['chats'][0]) {
        store.setState({
            chats: [chat, ...store.getState().chats],
            currentChatId: chat.id,
            messages: [],
            view: 'chat'
        });
    },

    setCurrentChat(chatId: string) {
        store.setState({ currentChatId: chatId, view: 'chat' });
    },

    deleteChat(chatId: string) {
        const chats = store.getState().chats.filter(c => c.id !== chatId);
        const currentChatId = store.getState().currentChatId === chatId ? null : store.getState().currentChatId;
        store.setState({ chats, currentChatId, view: currentChatId ? 'chat' : 'welcome' });
    },

    setMessages(messages: AppState['messages']) {
        store.setState({ messages });
    },

    addMessage(msg: AppState['messages'][0]) {
        store.setState({ messages: [...store.getState().messages, msg] });
    },

    updateStreamingContent(content: string) {
        store.setState({ streamingContent: content });
    },

    setStreaming(isStreaming: boolean) {
        store.setState({ isStreaming, streamingContent: isStreaming ? '' : store.getState().streamingContent });
    },

    // Memory actions - now using IndexedDB
    setMemories(memories: Memory[]) {
        store.setState({ memories });
    },

    async loadMemoriesFromDB() {
        try {
            const memories = await db.getAllMemories();
            store.setState({ memories });
        } catch (e) {
            console.error('Failed to load memories:', e);
        }
    },

    async addMemory(memory: Memory) {
        await db.saveMemory(memory);
        const memories = [...store.getState().memories, memory];
        store.setState({ memories });
    },

    async updateMemory(memory: Memory) {
        await db.saveMemory(memory);
        const memories = store.getState().memories.map(m => m.id === memory.id ? memory : m);
        store.setState({ memories });
    },

    async deleteMemory(id: string) {
        await db.deleteMemory(id);
        const memories = store.getState().memories.filter(m => m.id !== id);
        store.setState({ memories });
    },

    async toggleMemoryItem(id: string) {
        const memory = store.getState().memories.find(m => m.id === id);
        if (memory) {
            const updated = { ...memory, enabled: !memory.enabled };
            await db.saveMemory(updated);
            const memories = store.getState().memories.map(m => m.id === id ? updated : m);
            store.setState({ memories });
        }
    },

    toggleMemory() {
        const newState = !store.getState().memoryEnabled;
        store.setState({ memoryEnabled: newState });
        localStorage.setItem('nexus_memory_enabled', JSON.stringify(newState));
    },

    loadMemoryToggleState() {
        try {
            const saved = localStorage.getItem('nexus_memory_enabled');
            if (saved !== null) {
                store.setState({ memoryEnabled: JSON.parse(saved) });
            }
        } catch (e) {
            console.error('Failed to load memory toggle state:', e);
        }
    },

    openModal(modal: AppState['modalOpen']) {
        store.setState({ modalOpen: modal });
    },

    closeModal() {
        store.setState({ modalOpen: 'none' });
    },

    setView(view: AppState['view']) {
        store.setState({ view });
    },

    toggleSidebar() {
        store.setState({ sidebarOpen: !store.getState().sidebarOpen });
    },

    setSearchMode(mode: AppState['searchMode']) {
        store.setState({ searchMode: mode });
    },

    setSearching(isSearching: boolean) {
        store.setState({ isSearching });
    }
};

// Memory save detection patterns - comprehensive triggers
const SAVE_PATTERNS = [
    // Direct save commands with pronouns
    /\b(save|remember|store|keep|note|memorize)\s+(this|that|it)\b/i,
    // Memory-specific phrases
    /\b(save|store|put|add|keep)\s+(this\s+)?(in|to)\s+(your\s+)?memory\b/i,
    /\bsave\s+(this\s+)?in\s+your\s+memory\b/i,
    /\bmemorize\s+(this|that|it)?\b/i,
    /\badd\s+(this\s+)?to\s+(your\s+)?memory\b/i,
    // Name patterns
    /\bmy\s+name\s+is\s+(\w+)/i,
    /\bi\s+am\s+(\w+)/i,
    /\bcall\s+me\s+(\w+)/i,
    // Remember that...
    /\bremember\s+that\s+(.+)/i,
    /\bsave\s+(.+)\s+to\s+memory/i,
    /\bstore\s+in\s+memory\b/i,
    // Imperative commands
    /\bdon'?t\s+forget\b/i,
    /\bkeep\s+in\s+mind\b/i,
    /\bplease\s+(save|remember|store|memorize)\b/i,
    // Short standalone triggers (end of message)
    /,?\s*(save\s+it|remember\s+it|memorize\s+it|store\s+it)\s*[.!]?\s*$/i
];

export function shouldAutoSaveMemory(content: string): boolean {
    return SAVE_PATTERNS.some(pattern => pattern.test(content));
}

export function extractMemoryContent(content: string): { title: string; value: string; type: Memory['type'] } | null {
    // Name extraction
    const nameMatch = content.match(/\bmy\s+name\s+is\s+(\w+)/i) ||
        content.match(/\bi\s+am\s+(\w+)/i) ||
        content.match(/\bcall\s+me\s+(\w+)/i);
    if (nameMatch) {
        return { title: 'Name', value: nameMatch[1], type: 'user_profile' };
    }

    // Remember that... / don't forget that...
    const rememberMatch = content.match(/\b(?:remember|don'?t\s+forget)\s+that\s+(.+)/i);
    if (rememberMatch) {
        const value = rememberMatch[1].replace(/[.!,\s]+$/, '').trim();
        return { title: 'Fact', value, type: 'fact' };
    }

    // "save this: content" or "save in memory: content" pattern
    const colonMatch = content.match(/\b(?:save|store|remember|memorize)\s*(?:this|that|it)?\s*(?:in\s+(?:your\s+)?memory)?\s*[:\-]\s*(.+)/i);
    if (colonMatch) {
        const value = colonMatch[1].trim().replace(/[.!,\s]+$/, '');
        if (value) {
            return { title: 'Note', value, type: 'fact' };
        }
    }

    // "content, save it" pattern - extract content BEFORE the save trigger
    const beforeSaveMatch = content.match(/^(.+?)[,;]\s*(?:save|remember|store|memorize)\s+(?:this|that|it)\s*[.!]?\s*$/i);
    if (beforeSaveMatch) {
        const value = beforeSaveMatch[1].trim();
        if (value) {
            // Try to extract a title from the content
            const titleMatch = value.match(/^(?:my\s+)?(\w+(?:\s+\w+)?)\s+(?:is|are)\s+/i);
            const title = titleMatch ? titleMatch[1].charAt(0).toUpperCase() + titleMatch[1].slice(1) : 'Note';
            return { title, value, type: 'fact' };
        }
    }

    // Generic save request - content followed by save trigger at end
    const genericSaveMatch = content.match(/^(.+?)[\s,]*(?:save|remember|store|memorize)\s*(?:this|that|it)?(?:\s+(?:in|to)\s+(?:your\s+)?memory)?\s*[.!]?\s*$/i);
    if (genericSaveMatch) {
        const value = genericSaveMatch[1].trim().replace(/[,;]\s*$/, '');
        if (value && value.length > 2) {
            // Try to extract title from "X is Y" patterns
            const titleMatch = value.match(/^(?:my\s+)?(\w+(?:\s+\w+)?)\s+(?:is|are)\s+/i);
            const title = titleMatch ? titleMatch[1].charAt(0).toUpperCase() + titleMatch[1].slice(1) : 'Note';
            return { title, value, type: 'fact' };
        }
    }

    // If just a bare trigger with no content, return null (caller should handle context)
    if (/^(?:save|remember|store|memorize)\s*(?:this|that|it)?\s*[.!]?\s*$/i.test(content.trim())) {
        return null;
    }

    return null;
}

// Build system prompt with all enabled memories
export function buildMemorySystemPrompt(): string {
    const state = store.getState();
    if (!state.memoryEnabled) return '';

    const enabledMemories = state.memories.filter(m => m.enabled);
    if (enabledMemories.length === 0) return '';

    let prompt = 'User Memory (use this information to personalize responses):\n';
    enabledMemories.forEach(m => {
        prompt += `- ${m.title}: ${m.content}\n`;
    });
    prompt += '\nIMPORTANT: Use this memory in your responses. If user asks about stored information, reference it directly.';

    return prompt;
}
