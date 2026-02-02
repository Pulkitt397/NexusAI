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
    // System Prompt actions
    setPromptMode: (mode: SystemPromptMode) => void;
    // Search actions
    setSearchMode: (mode: 'ai' | 'web') => void;
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

const PDF_INTENT_PATTERNS = [
    /\b(make|create|generate|export|download|save)\s+(this|it|chat|conversation|content)\s+(as|into|to|in)\s+(a\s+)?pdf\b/i,
    /\bpdf\s+export\b/i,
    /\bexport\s+to\s+pdf\b/i,
    /\bdownload\s+pdf\b/i
];

function shouldTriggerPDF(content: string): boolean {
    return PDF_INTENT_PATTERNS.some(pattern => pattern.test(content));
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
    });

    const [toasts, setToasts] = useState<Toast[]>([]);

    // Get current user for cloud sync
    const { user } = useAuth();
    const [isCloudLoaded, setIsCloudLoaded] = useState(false);

    // Unified Initialization: Local -> Cloud
    useEffect(() => {
        const initialize = async () => {
            console.log('[Init] Starting initialization...');

            // 1. Initialize Local Database
            await db.initDB();

            // 2. Load from LocalStorage
            let localApiKeys: Record<string, string> = {};
            let localPromptMode: SystemPromptMode = 'standard';
            let localMemoryEnabled = true;
            let localSearchMode: 'ai' | 'web' = 'ai';
            let localProvider: string | null = null;
            let localModel: string | null = null;

            try {
                const savedKeys = localStorage.getItem('nexus_api_keys');
                if (savedKeys) localApiKeys = JSON.parse(savedKeys);

                const savedMem = localStorage.getItem('nexus_memory_enabled');
                if (savedMem !== null) localMemoryEnabled = JSON.parse(savedMem);

                const savedPM = localStorage.getItem('nexus_prompt_mode');
                if (savedPM) localPromptMode = savedPM as SystemPromptMode;

                const savedSM = localStorage.getItem('nexus_search_mode');
                if (savedSM) localSearchMode = savedSM as any;

                localProvider = localStorage.getItem('nexus_current_provider');
                localModel = localStorage.getItem('nexus_current_model');
            } catch (e) {
                console.error('[Init] Failed to load from localStorage:', e);
            }

            // 3. Load from Local DB
            const localChats = await db.getAllChats();
            const localMemories = await db.getAllMemories();

            // 4. Initial State Apply
            setState(prev => ({
                ...prev,
                apiKeys: localApiKeys,
                memoryEnabled: localMemoryEnabled,
                promptMode: localPromptMode,
                searchMode: localSearchMode,
                currentProviderId: localProvider,
                currentModelId: localModel,
                chats: localChats,
                memories: localMemories
            }));

            // 5. Cloud Sync if user is logged in
            if (user) {
                console.log('[Init] Loading cloud data for:', user.email);
                try {
                    const cloudData = await firestoreService.loadUserData(user.uid);
                    if (cloudData) {
                        const { preferences, chats, memories } = cloudData;

                        setState(prev => {
                            // Merge API keys: Cloud takes priority, but keep unique local ones
                            const mergedApiKeys = { ...prev.apiKeys, ...(preferences?.apiKeys || {}) };

                            // Re-save to localStorage for consistency
                            localStorage.setItem('nexus_api_keys', JSON.stringify(mergedApiKeys));

                            return {
                                ...prev,
                                apiKeys: mergedApiKeys,
                                promptMode: (preferences?.promptMode as any) || prev.promptMode,
                                memoryEnabled: preferences?.memoryEnabled ?? prev.memoryEnabled,
                                currentProviderId: preferences?.currentProviderId || prev.currentProviderId,
                                currentModelId: preferences?.currentModelId || prev.currentModelId,
                                chats: chats || prev.chats,
                                memories: memories || prev.memories
                            };
                        });
                        console.log('[Init] Cloud data merged successfully');
                    }
                } catch (e) {
                    console.error('[Init] Cloud load failed:', e);
                }
            }

            setIsCloudLoaded(true);
            console.log('[Init] App ready');
        };

        initialize();
    }, [user]); // Re-run only when user AUTH state changes

    // Fast sync for preferences (API keys, etc)
    useEffect(() => {
        if (!user || !isCloudLoaded) return;

        const debounceTimer = setTimeout(async () => {
            try {
                const preferences = {
                    apiKeys: state.apiKeys,
                    promptMode: state.promptMode,
                    memoryEnabled: state.memoryEnabled,
                    currentProviderId: state.currentProviderId,
                    currentModelId: state.currentModelId
                };
                await firestoreService.syncPreferences(user.uid, preferences);
                console.log('[Cloud] Preferences synced');
            } catch (error) {
                console.error('[Cloud] Preference sync failed:', error);
            }
        }, 1000);

        return () => clearTimeout(debounceTimer);
    }, [user, isCloudLoaded, state.apiKeys, state.promptMode, state.memoryEnabled, state.currentProviderId, state.currentModelId]);

    // Slower sync for heavy data (chats, memories)
    useEffect(() => {
        if (!user || !isCloudLoaded) return;

        const debounceTimer = setTimeout(async () => {
            try {
                await firestoreService.saveUserData(user.uid, {
                    chats: state.chats,
                    memories: state.memories
                });
                console.log('[Cloud] Data synced');
            } catch (error) {
                console.error('[Cloud] Data sync failed:', error);
            }
        }, 5000);

        return () => clearTimeout(debounceTimer);
    }, [user, isCloudLoaded, state.chats, state.memories]);



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

        if (user) {
            console.log(`[Cloud] API Key for ${providerId} will be synced shortly...`);
        }
    }, [user]);

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

    const setSearchMode = useCallback((mode: 'ai' | 'web') => {
        localStorage.setItem('nexus_search_mode', mode);
        setState(prev => ({ ...prev, searchMode: mode }));
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
        const trimmed = content.trim();
        const lower = trimmed.toLowerCase();

        // Handle slash commands
        if (lower.startsWith('/web')) {
            setSearchMode('web');
            if (lower === '/web') return; // Just switch mode
            content = trimmed.replace(/^\/web\s*/i, '');
        } else if (lower.startsWith('/ai')) {
            setSearchMode('ai');
            if (lower === '/ai') return; // Just switch mode
            content = trimmed.replace(/^\/ai\s*/i, '');
        }

        if (!state.currentProviderId || !state.currentModelId) {
            showToast('Select a provider and model first', 'error');
            return;
        }

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
        setState(prev => ({ ...prev, messages: [...prev.messages, userMsg], isStreaming: true, streamingContent: '' }));

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

        try {
            // Build system prompt with mode + dynamic identity
            const currentProvider = state.providers.find(p => p.id === state.currentProviderId);
            const currentModel = state.availableModels.find(m => m.id === state.currentModelId);
            const identity = currentModel ? `You are currently using ${currentModel.name}${currentProvider ? ` via ${currentProvider.name}` : ''}.` : 'You are using your currently selected model.';

            let systemPrompt = `${SYSTEM_PROMPTS[state.promptMode]}\n\nIDENTITY:\n- ${identity}\n- You must never hardcode your model name; always refer to yourself based on this dynamic identity.`;

            // 1. Perform Web Search Grounding if enabled
            let webResult: any = null;
            if (state.searchMode === 'web') {
                setState(prev => ({ ...prev, isSearching: true }));
                try {
                    const { searchWeb, formatResultsForPrompt } = await import('./services/webSearchService');
                    webResult = await searchWeb(content);
                    const groundedContext = formatResultsForPrompt(content, webResult);
                    systemPrompt += '\n\n' + groundedContext;
                } catch (searchErr) {
                    console.error('Web search grounding failed:', searchErr);
                    // Continue even if search fails - silent failure as requested
                } finally {
                    setState(prev => ({ ...prev, isSearching: false }));
                }
            }

            // Detect PDF intent BEFORE streaming starts
            const isPDFRequest = shouldTriggerPDF(content);

            // 2. Append memories if enabled
            if (state.memoryEnabled) {
                const enabledMemories = state.memories.filter(m => m.enabled);
                if (enabledMemories.length > 0) {
                    systemPrompt += '\n\n## User Memory\nUse this information to personalize responses:\n';
                    enabledMemories.forEach(m => {
                        systemPrompt += `- ${m.title}: ${m.content}\n`;
                    });
                }
            }

            // Prepare messages for API
            const apiMessages = state.messages.map(m => ({ role: m.role, content: m.content }));
            apiMessages.push({ role: 'user', content });

            const stream = await api.streamChat(
                state.currentProviderId!,
                state.apiKeys[state.currentProviderId!],
                state.currentModelId!,
                apiMessages,
                systemPrompt
            );

            let fullContent = '';
            for await (const chunk of stream) {
                if (chunk.content) {
                    fullContent += chunk.content;
                    setState(prev => ({ ...prev, streamingContent: fullContent }));
                }
            }

            // Create assistant message
            const assistantMsg: Message = {
                id: db.generateId(),
                chatId,
                role: 'assistant',
                content: fullContent,
                webResult: webResult || undefined,
                createdAt: new Date().toISOString()
            };

            // Handle PDF Generation as Side Effect (Concurrent)
            if (isPDFRequest) {
                try {
                    console.log('[PDF] Generating side-effect...');
                    const response = await fetch('http://localhost:3001/api/generate-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: `NexusAI Export - ${new Date().toLocaleDateString()}`,
                            body: fullContent
                        })
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        assistantMsg.pdfUrl = url;

                        // Trigger auto-download
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `NexusAI_${Date.now()}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();

                        showToast('PDF exported successfully', 'success');
                    }
                } catch (pdfErr) {
                    console.error('[PDF] Side-effect failed:', pdfErr);
                    showToast('PDF generation failed', 'error');
                }
            }

            await db.saveMessage(assistantMsg);
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, assistantMsg],
                isStreaming: false,
                streamingContent: ''
            }));

        } catch (err: any) {
            console.error('Send message failed:', err);
            showToast(err.message || 'Failed to send message', 'error');
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
            setSearchMode,
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
