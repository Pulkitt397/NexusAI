// Main App Component
import React, { useEffect } from 'react';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { SettingsModal } from '@/components/SettingsModal';
import { MemoryModal } from '@/components/MemoryModal';
import { useApp } from '@/context';
import { PROMPT_MODE_LABELS, type SystemPromptMode } from '@/systemPrompts';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/components/LoginPage';

function Dashboard() {
    const {
        state,
        sendMessage,
        createChat,
        selectChat,
        deleteChat,
        selectProvider,
        selectModel,
        setPromptMode,
        openModal,
        closeModal,
        enhancePrompt,
        setSearchMode
    } = useApp();

    const [showProviderDropdown, setShowProviderDropdown] = React.useState(false);
    const [showModelDropdown, setShowModelDropdown] = React.useState(false);
    const [showPromptModeDropdown, setShowPromptModeDropdown] = React.useState(false);

    const currentProvider = state.providers.find(p => p.id === state.currentProviderId);
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);
    const hasMessages = state.messages.length > 0;
    const currentPromptLabel = PROMPT_MODE_LABELS[state.promptMode];

    const handleProviderSelect = async (providerId: string) => {
        setShowProviderDropdown(false);
        await selectProvider(providerId);
    };

    const handleModelSelect = (modelId: string) => {
        setShowModelDropdown(false);
        selectModel(modelId);
    };

    const handlePromptModeSelect = (mode: SystemPromptMode) => {
        setShowPromptModeDropdown(false);
        setPromptMode(mode);
    };

    // Format messages for the chat component
    const formattedMessages = state.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content
    }));

    const enabledMemoryCount = state.memories.filter(m => m.enabled).length;

    // AUTH GUARD
    const { user, loading, logout } = useAuth();

    if (loading) {
        // Loading Screen (matches splash)
        return (
            <div className="h-screen bg-[#0a0a0b] flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center" >
                        <span className="text-2xl">✦</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="h-screen bg-[#0a0a0b] flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                className="w-64 h-full border-r border-white/10 flex flex-col bg-[#0a0a0b]/80 backdrop-blur-xl shrink-0"
            >
                {/* Logo */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">✦</span>
                        <span className="font-semibold text-white">NexusAI</span>
                    </div>
                </div>

                {/* New Chat */}
                <div className="p-3">
                    <button
                        onClick={createChat}
                        disabled={!state.currentModelId}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                            state.currentModelId
                                ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30"
                                : "bg-white/5 text-white/40 cursor-not-allowed"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                {/* Provider/Model selectors */}
                <div className="px-3 space-y-2">
                    {/* Provider dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProviderDropdown(!showProviderDropdown);
                                setShowModelDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                {currentProvider ? (
                                    <>
                                        <span>{currentProvider.icon}</span>
                                        {currentProvider.name}
                                    </>
                                ) : (
                                    '🔌 Select Provider'
                                )}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                        <AnimatePresence>
                            {showProviderDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0b] border border-white/10 rounded-lg overflow-hidden z-20"
                                >
                                    {state.providers.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleProviderSelect(p.id)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors",
                                                p.id === state.currentProviderId ? "bg-violet-500/20 text-violet-400" : "text-white/70"
                                            )}
                                        >
                                            <span>{p.icon}</span>
                                            {p.name}
                                            {state.apiKeys[p.id] && (
                                                <span className="ml-auto text-green-400 text-xs">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Model dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                if (state.apiKeys[state.currentProviderId || '']) {
                                    setShowModelDropdown(!showModelDropdown);
                                    setShowProviderDropdown(false);
                                }
                            }}
                            disabled={!state.apiKeys[state.currentProviderId || ''] || state.isLoadingModels}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                state.apiKeys[state.currentProviderId || '']
                                    ? "bg-white/5 hover:bg-white/10 text-white/80"
                                    : "bg-white/5 text-white/30 cursor-not-allowed"
                            )}
                        >
                            <span className="truncate">
                                {state.isLoadingModels
                                    ? '⏳ Loading...'
                                    : currentModel
                                        ? currentModel.name
                                        : '🤖 Select Model'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                        </button>
                        <AnimatePresence>
                            {showModelDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0b] border border-white/10 rounded-lg overflow-hidden z-20 max-h-60 overflow-y-auto"
                                >
                                    {state.availableModels.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => handleModelSelect(m.id)}
                                            className={cn(
                                                "w-full px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors truncate",
                                                m.id === state.currentModelId ? "bg-violet-500/20 text-violet-400" : "text-white/70"
                                            )}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Chats list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <p className="text-xs text-white/40 px-2 py-1">Recent Chats</p>
                    {state.chats.length === 0 ? (
                        <p className="text-xs text-white/30 px-2 py-4">No chats yet</p>
                    ) : (
                        state.chats.map(chat => (
                            <div
                                key={chat.id}
                                className={cn(
                                    "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors",
                                    chat.id === state.currentChatId
                                        ? "bg-violet-500/20 text-white"
                                        : "text-white/60 hover:bg-white/5"
                                )}
                                onClick={() => selectChat(chat.id)}
                            >
                                <MessageSquare className="w-4 h-4 shrink-0" />
                                <span className="truncate flex-1">{chat.title}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteChat(chat.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 space-y-2">
                    {/* Prompt Mode Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowPromptModeDropdown(!showPromptModeDropdown);
                                setShowProviderDropdown(false);
                                setShowModelDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span>🎯</span>
                                {currentPromptLabel.name}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                        <AnimatePresence>
                            {showPromptModeDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute bottom-full left-0 right-0 mb-1 bg-[#0a0a0b] border border-white/10 rounded-lg overflow-hidden z-20"
                                >
                                    {(Object.keys(PROMPT_MODE_LABELS) as SystemPromptMode[]).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => handlePromptModeSelect(mode)}
                                            className={cn(
                                                "w-full flex flex-col items-start px-3 py-2 text-left hover:bg-white/10 transition-colors",
                                                state.promptMode === mode ? "bg-violet-500/20" : ""
                                            )}
                                        >
                                            <span className={cn(
                                                "text-sm",
                                                state.promptMode === mode ? "text-violet-400" : "text-white/80"
                                            )}>
                                                {PROMPT_MODE_LABELS[mode].name}
                                            </span>
                                            <span className="text-xs text-white/40">
                                                {PROMPT_MODE_LABELS[mode].description}
                                            </span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => openModal('memory')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-lg text-sm transition-colors"
                    >
                        <span>🧠</span>
                        Memory
                        {enabledMemoryCount > 0 && (
                            <span className="ml-auto text-xs bg-violet-500/30 text-violet-400 px-1.5 py-0.5 rounded">
                                {enabledMemoryCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => openModal('apiKey')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-lg text-sm transition-colors"
                    >
                        <span>⚙️</span>
                        Settings
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </motion.aside>

            {/* Main content */}
            <main className="flex-1 h-full overflow-hidden">
                <AnimatedAIChat
                    onSendMessage={sendMessage}
                    isStreaming={state.isStreaming}
                    streamingContent={state.streamingContent}


                    messages={formattedMessages}
                    onOpenMemory={() => openModal('memory')}
                    onOpenSettings={() => openModal('apiKey')}
                    memoryCount={enabledMemoryCount}
                    currentModel={currentModel?.name || null}
                    onEnhance={enhancePrompt}
                    searchMode={state.searchMode}
                    onSetSearchMode={setSearchMode}
                />
            </main>

            {/* Modals */}
            <SettingsModal
                isOpen={state.modalOpen === 'apiKey'}
                onClose={closeModal}
            />
            <MemoryModal
                isOpen={state.modalOpen === 'memory'}
                onClose={closeModal}
            />
        </div>
    );
}

export default function App() {
    return <Dashboard />;
}
