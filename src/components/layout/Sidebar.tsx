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
                width: isMobile ? 280 : (isOpen ? 280 : 0),
                x: isMobile && !isOpen ? -280 : 0,
                opacity: !isMobile && !isOpen ? 0 : 1
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={cn(
                "h-full border-r border-white/5 flex flex-col bg-[#0c0c0e] shrink-0 overflow-hidden z-20",
                isMobile ? "fixed inset-y-0 left-0 shadow-2xl" : "relative"
            )}
        >
            {/* Header / Logo */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 bg-[#09090b]">
                <div className="flex items-center gap-2.5 font-semibold text-white">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-sm">N</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="tracking-tight text-sm">Nexus AI</span>
                        <span className="text-[10px] text-white/30 -mt-0.5">v2.0</span>
                    </div>
                </div>
            </div>

            {/* Main Actions */}
            <div className="p-3 space-y-2">
                <button
                    onClick={createChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border-0"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

{/* Navigation / Context */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">

                {/* Recent Chats */}
                <div>
                    <h3 className="text-[10px] font-semibold text-white/30 px-2 mb-3 uppercase tracking-widest">Workspace</h3>
                    <div className="space-y-1">
                        {state.chats.length === 0 ? (
                            <div className="text-xs text-white/20 px-2 italic py-2">No active sessions</div>
                        ) : (
                            state.chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => selectChat(chat.id)}
                                    className={cn(
                                        "group w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all cursor-pointer",
                                        chat.id === state.currentChatId
                                            ? "bg-white/10 text-white border border-white/10"
                                            : "text-white/50 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {chat.latestCode ? (
                                        <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    ) : (
                                        <MessageSquare className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                    )}
                                    <span className="truncate flex-1 text-sm">{chat.title}</span>
                                    {chat.latestCode && (
                                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold tracking-tighter shrink-0 border border-indigo-500/20">App</span>
                                    )}
                                    {chat.id === state.currentChatId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 rounded transition-all ml-1 hover:bg-white/5"
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
            <div className="p-3 border-t border-white/5 space-y-1 bg-[#0c0c0e]">
                <button
                    onClick={() => openModal('memory')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors group"
                >
                    <Brain className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                    <span>Memory</span>
                    {enabledMemoryCount > 0 && <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full">{enabledMemoryCount}</span>}
                </button>

                <button
                    onClick={() => openModal('apiKey')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors group"
                >
                    <Settings className="w-4 h-4 text-violet-400 group-hover:text-white" />
                    <span>Settings</span>
                </button>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </motion.aside>
    );
} 
