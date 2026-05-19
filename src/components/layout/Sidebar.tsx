import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, ChevronDown, LogOut, Code, Settings, Brain, Sparkles } from 'lucide-react';
import { useApp } from '@/context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function Sidebar({ isMobile, isOpen, onClose, isWebDevMode, setWebDevMode }: {
    isMobile: boolean,
    isOpen: boolean,
    onClose: () => void,
    isWebDevMode: boolean,
    setWebDevMode: (v: boolean) => void
}) {
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
            <div className="h-16 flex items-center px-4 border-b border-white/5 bg-[#09090b]">
                <div className="flex items-center gap-3 font-semibold text-white">
                    <div className="w-10 h-10 relative">
                        <svg viewBox="0 0 48 48" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="nexusGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="50%" stopColor="#a78bfa" />
                                    <stop offset="100%" stopColor="#c084fc" />
                                </linearGradient>
                                <linearGradient id="nexusGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                            <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#nexusGrad2)" opacity="0.15" />
                            <rect x="2" y="2" width="44" height="44" rx="12" stroke="url(#nexusGrad1)" strokeWidth="1.5" fill="none" opacity="0.5" />
                            <path d="M16 32V16L24 26L32 16V32" stroke="url(#nexusGrad1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <circle cx="16" cy="32" r="2" fill="#818cf8" />
                            <circle cx="32" cy="32" r="2" fill="#c084fc" />
                            <circle cx="24" cy="26" r="1.5" fill="#a78bfa" />
                            <circle cx="16" cy="16" r="2" fill="#6366f1" />
                            <circle cx="32" cy="16" r="2" fill="#8b5cf6" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">Nexus</span>
                        <span className="text-[10px] text-white/30 -mt-0.5 font-medium">Intelligent Workspace</span>
                    </div>
                </div>
            </div>

            {/* Main Actions */}
            <div className="p-3 space-y-2">
                <button
                    onClick={() => { setWebDevMode(false); createChat(); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border-0"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
                <button
                    onClick={() => setWebDevMode(!isWebDevMode)}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                        isWebDevMode
                            ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                            : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border-white/10"
                    )}
                >
                    <Code className="w-4 h-4" />
                    {isWebDevMode ? 'Exit Studio' : 'Open Studio'}
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setWebDevMode(true);
                                            selectChat(chat.id);
                                        }}
                                        className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold tracking-tighter shrink-0 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                    >
                                        Open
                                    </button>
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
