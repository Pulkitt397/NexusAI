// React Context for NexusAI State Management
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppState, Chat, Message, Memory, Provider, Model } from './types';
import type { SystemPromptMode } from './systemPrompts';
import { SYSTEM_PROMPTS } from './systemPrompts';
import * as db from './db';
import * as api from './api';
import { shouldAutoSaveMemory, extractMemoryContent, buildMemorySystemPrompt } from './store';
import { useAuth } from './context/AuthContext';
import * as firestoreService from './services/firestoreService';

const PROVIDERS: Provider[] = [
    { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#4285f4', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'groq', name: 'Groq', icon: '⚡', color: '#f97316', baseUrl: 'https://api.groq.com/openai/v1' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', color: '#8b5cf6', baseUrl: 'https://openrouter.ai/api/v1' }
];

interface AppContextType {
    state: AppState;
    // API Key actions
    setApiKey: (providerId: string, key: string) => void;
    // Provider/Model actions
    selectProvider: (providerId: string) => Promise<void>;
    selectModel: (modelId: string) => void;
    // System Prompt actions
    setPromptMode: (mode: SystemPromptMode) => void;
    // Chat actions
    createChat: () => Promise<void>;
    selectChat: (chatId: string) => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    // Memory actions
    loadMemories: () => Promise<void>;
    addMemory: (memory: Memory) => Promise<void>;
    deleteMemory: (id: string) => Promise<void>;
    toggleMemoryItem: (id: string) => Promise<void>;
    toggleMemoryEnabled: () => void;
    // UI actions
    openModal: (modal: AppState['modalOpen']) => void;
    closeModal: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    enhancePrompt: (input: string) => Promise<string>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({
        apiKeys: {},
        providers: PROVIDERS,
        currentProviderId: null,
        currentModelId: null,
        availableModels: [],
        isLoadingModels: false,
        promptMode: 'standard',
        chats: [],
        currentChatId: null,
        messages: [],
        memories: [],
        memoryEnabled: true,
        view: 'welcome',
        modalOpen: 'none',
        sidebarOpen: true,
        isStreaming: false,
        streamingContent: ''
    });

    const [toasts, setToasts] = useState<Toast[]>([]);

    // Get current user for cloud sync
    const { user } = useAuth();
    const [isCloudLoaded, setIsCloudLoaded] = useState(false);

    // Load data from Firestore when user logs in
    useEffect(() => {
        if (!user || isCloudLoaded) return;

        const loadFromCloud = async () => {
            console.log('[Cloud] Loading user data...');
            const cloudData = await firestoreService.loadUserData(user.uid);

            if (cloudData) {
                // Apply cloud data to state
                if (cloudData.preferences) {
                    const { apiKeys, promptMode, memoryEnabled, currentProviderId, currentModelId } = cloudData.preferences;
                    setState(prev => ({
                        ...prev,
                        apiKeys: apiKeys || prev.apiKeys,
                        promptMode: (promptMode as any) || prev.promptMode,
                        memoryEnabled: memoryEnabled ?? prev.memoryEnabled,
                        currentProviderId: currentProviderId || prev.currentProviderId,
                        currentModelId: currentModelId || prev.currentModelId
                    }));
                    // Also save to localStorage for offline access
                    if (apiKeys) localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
                    if (promptMode) localStorage.setItem('nexus_prompt_mode', promptMode);
                    if (currentProviderId) localStorage.setItem('nexus_current_provider', currentProviderId);
                    if (currentModelId) localStorage.setItem('nexus_current_model', currentModelId);
                }
                if (cloudData.chats) {
                    setState(prev => ({ ...prev, chats: cloudData.chats }));
                }
                if (cloudData.memories) {
                    setState(prev => ({ ...prev, memories: cloudData.memories }));
                }
                console.log('[Cloud] User data loaded successfully');
            }
            setIsCloudLoaded(true);
        };

        loadFromCloud();
    }, [user, isCloudLoaded]);

    // Debounced sync to Firestore on state changes
    useEffect(() => {
        if (!user || !isCloudLoaded) return;

        const debounceTimer = setTimeout(() => {
            const preferences = {
                apiKeys: state.apiKeys,
                promptMode: state.promptMode,
                memoryEnabled: state.memoryEnabled,
                currentProviderId: state.currentProviderId,
                currentModelId: state.currentModelId
            };
            firestoreService.saveUserData(user.uid, {
                preferences,
                chats: state.chats,
                memories: state.memories
            });
        }, 2000); // 2 second debounce

        return () => clearTimeout(debounceTimer);
    }, [user, isCloudLoaded, state.apiKeys, state.promptMode, state.memoryEnabled, state.currentProviderId, state.currentModelId, state.chats, state.memories]);

    // Initialize
    useEffect(() => {
        const init = async () => {
            await db.initDB();

            // Load API keys
            let apiKeys: Record<string, string> = {};
            try {
                const saved = localStorage.getItem('nexus_api_keys');
                if (saved) {
                    apiKeys = JSON.parse(saved);
                    setState(prev => ({ ...prev, apiKeys }));
                }
            } catch (e) { console.error('Failed to load API keys:', e); }

            // Load memory toggle state
            try {
                const savedMem = localStorage.getItem('nexus_memory_enabled');
                if (savedMem !== null) {
                    setState(prev => ({ ...prev, memoryEnabled: JSON.parse(savedMem) }));
                }
            } catch (e) { console.error('Failed to load memory state:', e); }

            // Load saved prompt mode
            try {
                const savedPromptMode = localStorage.getItem('nexus_prompt_mode');
                if (savedPromptMode && ['standard', 'compact', 'developer'].includes(savedPromptMode)) {
                    setState(prev => ({ ...prev, promptMode: savedPromptMode as SystemPromptMode }));
                }
            } catch (e) { console.error('Failed to load prompt mode:', e); }

            // Load saved provider and model
            try {
                const savedProvider = localStorage.getItem('nexus_current_provider');
                const savedModel = localStorage.getItem('nexus_current_model');

                if (savedProvider && apiKeys[savedProvider]) {
                    setState(prev => ({
                        ...prev,
                        currentProviderId: savedProvider,
                        isLoadingModels: true
                    }));

                    // Fetch models for the saved provider
                    try {
                        const models = await api.fetchModels(savedProvider, apiKeys[savedProvider]);
                        const modelToSelect = savedModel && models.find(m => m.id === savedModel)
                            ? savedModel
                            : models[0]?.id || null;

                        setState(prev => ({
                            ...prev,
                            availableModels: models,
                            currentModelId: modelToSelect,
                            isLoadingModels: false
                        }));
                    } catch (e) {
                        console.error('Failed to load models:', e);
                        setState(prev => ({ ...prev, isLoadingModels: false }));
                    }
                }
            } catch (e) { console.error('Failed to load provider/model:', e); }

            // Load chats
            const chats = await db.getAllChats();
            setState(prev => ({ ...prev, chats }));

            // Load memories
            const memories = await db.getAllMemories();
            setState(prev => ({ ...prev, memories }));
        };
        init();
    }, []);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const setApiKey = useCallback((providerId: string, key: string) => {
        setState(prev => {
            const apiKeys = { ...prev.apiKeys, [providerId]: key };
            localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
            return { ...prev, apiKeys };
        });
    }, []);

    const selectProvider = useCallback(async (providerId: string) => {
        // Save to localStorage
        localStorage.setItem('nexus_current_provider', providerId);

        setState(prev => ({
            ...prev,
            currentProviderId: providerId,
            currentModelId: null,
            availableModels: [],
            isLoadingModels: true
        }));

        const apiKey = state.apiKeys[providerId];
        if (apiKey) {
            try {
                const models = await api.fetchModels(providerId, apiKey);
                const firstModelId = models.length > 0 ? models[0].id : null;

                // Save default model
                if (firstModelId) {
                    localStorage.setItem('nexus_current_model', firstModelId);
                }

                setState(prev => ({
                    ...prev,
                    availableModels: models,
                    isLoadingModels: false,
                    currentModelId: firstModelId
                }));
            } catch (err) {
                showToast('Failed to load models', 'error');
                setState(prev => ({ ...prev, availableModels: [], isLoadingModels: false }));
            }
        } else {
            setState(prev => ({ ...prev, isLoadingModels: false, modalOpen: 'apiKey' }));
        }
    }, [state.apiKeys, showToast]);

    const selectModel = useCallback((modelId: string) => {
        // Save to localStorage
        localStorage.setItem('nexus_current_model', modelId);
        setState(prev => ({ ...prev, currentModelId: modelId }));
    }, []);

    const setPromptMode = useCallback((mode: SystemPromptMode) => {
        localStorage.setItem('nexus_prompt_mode', mode);
        setState(prev => ({ ...prev, promptMode: mode }));
    }, []);

    const createChat = useCallback(async () => {
        if (!state.currentProviderId || !state.currentModelId) {
            showToast('Select a provider and model first', 'error');
            return;
        }

        const chat: Chat = {
            id: db.generateId(),
            title: 'New Chat',
            providerId: state.currentProviderId,
            modelId: state.currentModelId,
            memoryEnabled: state.memoryEnabled,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.saveChat(chat);
        setState(prev => ({
            ...prev,
            chats: [chat, ...prev.chats],
            currentChatId: chat.id,
            messages: [],
            view: 'chat'
        }));
    }, [state.currentProviderId, state.currentModelId, state.memoryEnabled, showToast]);

    const selectChat = useCallback(async (chatId: string) => {
        const messages = await db.getMessagesByChat(chatId);
        setState(prev => ({ ...prev, currentChatId: chatId, messages, view: 'chat' }));
    }, []);

    const deleteChat = useCallback(async (chatId: string) => {
        await db.deleteChat(chatId);
        setState(prev => {
            const chats = prev.chats.filter(c => c.id !== chatId);
            const currentChatId = prev.currentChatId === chatId ? null : prev.currentChatId;
            return { ...prev, chats, currentChatId, view: currentChatId ? 'chat' : 'welcome' };
        });
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!state.currentProviderId || !state.currentModelId) return;

        const apiKey = state.apiKeys[state.currentProviderId];
        if (!apiKey) {
            showToast('Please add an API key', 'error');
            return;
        }

        // Check for memory save trigger
        const shouldSave = shouldAutoSaveMemory(content);
        const extracted = shouldSave ? extractMemoryContent(content) : null;

        // Create chat if needed
        let chatId = state.currentChatId;
        if (!chatId) {
            const chat: Chat = {
                id: db.generateId(),
                title: content.slice(0, 50),
                providerId: state.currentProviderId,
                modelId: state.currentModelId,
                memoryEnabled: state.memoryEnabled,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await db.saveChat(chat);
            chatId = chat.id;
            setState(prev => ({
                ...prev,
                chats: [chat, ...prev.chats],
                currentChatId: chat.id,
                view: 'chat'
            }));
        }

        // Save user message
        const userMsg: Message = {
            id: db.generateId(),
            chatId,
            role: 'user',
            content,
            createdAt: new Date().toISOString()
        };
        await db.saveMessage(userMsg);
        setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));

        // Auto-save memory if detected
        if (extracted) {
            const memory: Memory = {
                id: db.generateId(),
                type: extracted.type,
                title: extracted.title,
                content: extracted.value,
                enabled: true,
                createdAt: new Date().toISOString()
            };
            await db.saveMemory(memory);
            setState(prev => ({ ...prev, memories: [...prev.memories, memory] }));
            showToast(`Saved: ${extracted.title}`, 'success');
        }

        // Start streaming
        setState(prev => ({ ...prev, isStreaming: true, streamingContent: '' }));

        try {
            const messages = state.messages.map(m => ({ role: m.role, content: m.content }));
            messages.push({ role: 'user', content });

            // Build system prompt with mode + memories
            let systemPrompt = SYSTEM_PROMPTS[state.promptMode];

            // Append memories if enabled
            if (state.memoryEnabled) {
                const enabledMemories = state.memories.filter(m => m.enabled);
                if (enabledMemories.length > 0) {
                    systemPrompt += '\n\n## User Memory\nUse this information to personalize responses:\n';
                    enabledMemories.forEach(m => {
                        systemPrompt += `- ${m.title}: ${m.content}\n`;
                    });
                }
            }

            let fullContent = '';
            let lastUpdate = Date.now();
            const stream = api.streamChat(state.currentProviderId, apiKey, state.currentModelId, messages, systemPrompt);

            for await (const chunk of stream) {
                if (chunk.content) {
                    fullContent += chunk.content;

                    // Throttle state updates to ~25fps (every 40ms)
                    const now = Date.now();
                    if (now - lastUpdate > 40) {
                        setState(prev => ({ ...prev, streamingContent: fullContent }));
                        lastUpdate = now;
                    }
                }
                if (chunk.done) break;
            }

            // Final update to ensure everything is rendered
            setState(prev => ({ ...prev, streamingContent: fullContent }));

            // Save assistant message
            const assistantMsg: Message = {
                id: db.generateId(),
                chatId,
                role: 'assistant',
                content: fullContent,
                createdAt: new Date().toISOString()
            };
            await db.saveMessage(assistantMsg);
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, assistantMsg],
                isStreaming: false,
                streamingContent: ''
            }));

        } catch (err: any) {
            showToast(err.message || 'Failed to get response', 'error');
            setState(prev => ({ ...prev, isStreaming: false, streamingContent: '' }));
        }
    }, [state, showToast]);

    const loadMemories = useCallback(async () => {
        const memories = await db.getAllMemories();
        setState(prev => ({ ...prev, memories }));
    }, []);

    const addMemory = useCallback(async (memory: Memory) => {
        await db.saveMemory(memory);
        setState(prev => ({ ...prev, memories: [...prev.memories, memory] }));
        showToast('Memory saved!', 'success');
    }, [showToast]);

    const deleteMemory = useCallback(async (id: string) => {
        await db.deleteMemory(id);
        setState(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) }));
        showToast('Memory deleted', 'success');
    }, [showToast]);

    const toggleMemoryItem = useCallback(async (id: string) => {
        const memory = state.memories.find(m => m.id === id);
        if (memory) {
            const updated = { ...memory, enabled: !memory.enabled };
            await db.saveMemory(updated);
            setState(prev => ({
                ...prev,
                memories: prev.memories.map(m => m.id === id ? updated : m)
            }));
        }
    }, [state.memories]);

    const toggleMemoryEnabled = useCallback(() => {
        setState(prev => {
            const newState = !prev.memoryEnabled;
            localStorage.setItem('nexus_memory_enabled', JSON.stringify(newState));
            return { ...prev, memoryEnabled: newState };
        });
    }, []);

    const openModal = useCallback((modal: AppState['modalOpen']) => {
        setState(prev => ({ ...prev, modalOpen: modal }));
    }, []);

    const enhancePrompt = useCallback(async (input: string): Promise<string> => {
        if (!state.currentProviderId || !state.currentModelId) throw new Error("No model selected");
        const apiKey = state.apiKeys[state.currentProviderId];
        if (!apiKey) throw new Error("No API Key");

        const ENHANCER_PROMPT = `You are a prompt optimization assistant.

Take the user’s input and rewrite it to:
- Be clearer and more specific
- Add missing technical or contextual details
- Improve reasoning depth
- Preserve the user’s original intent

Do NOT change the request type.
Do NOT add unrelated features.
Do NOT answer the request.

Output only the improved prompt text.`;

        let fullContent = '';
        try {
            const stream = api.streamChat(
                state.currentProviderId,
                apiKey,
                state.currentModelId,
                [{ role: 'user', content: input }],
                ENHANCER_PROMPT
            );

            for await (const chunk of stream) {
                if (chunk.content) fullContent += chunk.content;
            }
            return fullContent.trim();
        } catch (e: any) {
            console.error("Enhancement failed", e);
            throw new Error(e.message || "Failed to enhance prompt");
        }
    }, [state.currentProviderId, state.currentModelId, state.apiKeys]);

    const closeModal = useCallback(() => {
        setState(prev => ({ ...prev, modalOpen: 'none' }));
    }, []);

    return (
        <AppContext.Provider value={{
            state,
            setApiKey,
            selectProvider,
            selectModel,
            setPromptMode,
            createChat,
            selectChat,
            deleteChat,
            sendMessage,
            loadMemories,
            addMemory,
            deleteMemory,
            toggleMemoryItem,
            toggleMemoryEnabled,
            openModal,
            closeModal,
            showToast,
            enhancePrompt
        }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg text-sm font-medium toast-animate-in ${toast.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            toast.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-white/10 text-white/80 border border-white/20'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </AppContext.Provider>
    );
}
