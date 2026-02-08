import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, ChevronDown, LogOut, Code, Settings, Brain } from 'lucide-react';
import { useApp } from '@/context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function Sidebar({ isMobile, isOpen, onClose }: { isMobile: boolean, isOpen: boolean, onClose: () => void }) {
    const {
        state,
        createChat,
        selectChat,
        deleteChat,
        selectProvider,
        selectModel,
        setPromptMode,
        openModal,
    } = useApp();
    const { logout } = useAuth();

    const [showProviderDropdown, setShowProviderDropdown] = useState(false);

    // Derived state
    const currentProvider = state.providers.find(p => p.id === state.currentProviderId);
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);
    const enabledMemoryCount = state.memories.filter(m => m.enabled).length;

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isMobile ? 280 : (isOpen ? 260 : 0),
                x: isMobile && !isOpen ? -280 : 0,
                opacity: !isMobile && !isOpen ? 0 : 1
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={cn(
                "h-full border-r border-white/5 flex flex-col bg-[#18181b] shrink-0 overflow-hidden z-20", // Hardcoded bg-layer-2 equivalent if CSS vars fail
                isMobile ? "fixed inset-y-0 left-0 shadow-2xl" : "relative"
            )}
        >
            {/* Header / Logo */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 bg-[#09090b]">
                <div className="flex items-center gap-2 font-semibold text-white/90">
                    <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">N</div>
                    <span className="tracking-tight">Nexus AI</span>
                </div>
            </div>

            {/* Main Actions */}
            <div className="p-3 space-y-2">
                <button
                    onClick={createChat}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-md text-sm font-medium transition-colors border border-indigo-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

            {/* Navigation / Context */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">

                {/* Recent Chats */}
                <div>
                    <h3 className="text-xs font-bold text-white/20 px-2 mb-2 uppercase tracking-wider">Workspace</h3>
                    <div className="space-y-0.5">
                        {state.chats.length === 0 ? (
                            <div className="text-xs text-white/30 px-2 italic py-2">No active sessions</div>
                        ) : (
                            state.chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => selectChat(chat.id)}
                                    className={cn(
                                        "group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all cursor-pointer",
                                        chat.id === state.currentChatId
                                            ? "bg-[#27272a] text-white font-medium shadow-sm"
                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {chat.latestCode ? (
                                        <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    ) : (
                                        <MessageSquare className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                    )}
                                    <span className="truncate flex-1">{chat.title}</span>
                                    {chat.latestCode && (
                                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1 rounded uppercase font-bold tracking-tighter shrink-0 border border-indigo-500/10">App</span>
                                    )}
                                    {chat.id === state.currentChatId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 p-1 rounded transition-all ml-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Settings */}
            <div className="p-3 border-t border-white/5 space-y-1 bg-[#18181b]">
                <button
                    onClick={() => openModal('memory')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors"
                >
                    <Brain className="w-4 h-4 opacity-70" />
                    <span>Memory</span>
                    {enabledMemoryCount > 0 && <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 rounded-full">{enabledMemoryCount}</span>}
                </button>

                <button
                    onClick={() => openModal('apiKey')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors"
                >
                    <Settings className="w-4 h-4 opacity-70" />
                    <span>Settings</span>
                </button>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-md text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4 opacity-70" />
                    <span>Sign Out</span>
                </button>
            </div>
        </motion.aside>
    );
} 
