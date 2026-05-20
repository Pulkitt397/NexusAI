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
                "h-full border-r border-white/[0.05] flex flex-col bg-[#050507]/80 backdrop-blur-xl shrink-0 overflow-hidden z-20 shadow-2xl",
                isMobile ? "fixed inset-y-0 left-0" : "relative"
            )}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center px-4 border-b border-white/[0.05] bg-[#030305]/40 backdrop-blur-md">
                <div className="flex items-center gap-3 font-semibold text-white">
                    <div className="w-10 h-10 relative">
                        <svg viewBox="0 0 48 48" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="nexusGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                                <linearGradient id="nexusBodyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#1e1b4b" />
                                    <stop offset="100%" stopColor="#311042" />
                                </linearGradient>
                                <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#nexusBodyGrad)" opacity="0.4" />
                            <rect x="2" y="2" width="44" height="44" rx="14" stroke="url(#nexusGlowGrad)" strokeWidth="1.5" fill="none" opacity="0.3" />
                            
                            <path d="M14 34V14" stroke="url(#nexusGlowGrad)" strokeWidth="4.5" strokeLinecap="round" filter="url(#premiumGlow)" />
                            <path d="M14 14L34 34" stroke="url(#nexusGlowGrad)" strokeWidth="4.5" strokeLinecap="round" filter="url(#premiumGlow)" />
                            <path d="M34 34V14" stroke="url(#nexusGlowGrad)" strokeWidth="4.5" strokeLinecap="round" filter="url(#premiumGlow)" />

                            <circle cx="14" cy="14" r="2.5" fill="#3b82f6" />
                            <circle cx="34" cy="34" r="2.5" fill="#ec4899" />
                            <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-black tracking-widest bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent uppercase font-sans">Nexus</span>
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 tracking-wider uppercase scale-90">AI</span>
                        </div>
                        <span className="text-[8px] text-white/40 tracking-[0.15em] font-bold uppercase mt-0.5">Cognitive Core</span>
                    </div>
                </div>
            </div>

            {/* Main Actions */}
            <div className="p-3 space-y-2 shrink-0">
                <motion.button
                    onClick={() => { setWebDevMode(false); createChat(); }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 border-0 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </motion.button>
                <motion.button
                    onClick={() => setWebDevMode(!isWebDevMode)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer",
                        isWebDevMode
                            ? "bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-inner shadow-violet-500/10"
                            : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10"
                    )}
                >
                    <Code className="w-4 h-4 text-violet-400" />
                    {isWebDevMode ? 'Exit Studio' : 'Open Studio'}
                </motion.button>
            </div>

            {/* Navigation / Context */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
                {/* Recent Chats */}
                <div>
                    <h3 className="text-[10px] font-bold text-white/30 px-2.5 mb-3 uppercase tracking-widest">Workspace</h3>
                    <div className="space-y-1">
                        {state.chats.length === 0 ? (
                            <div className="text-xs text-white/25 px-3.5 italic py-2.5">No active sessions</div>
                        ) : (
                            state.chats.map(chat => {
                                const isActive = chat.id === state.currentChatId;
                                return (
                                    <motion.div
                                        key={chat.id}
                                        onClick={() => selectChat(chat.id)}
                                        whileHover={{ x: 3 }}
                                        className={cn(
                                            "group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative overflow-hidden",
                                            isActive
                                                ? "bg-white/[0.06] text-white border border-white/10 shadow-lg shadow-black/10"
                                                : "text-white/40 hover:bg-white/5 hover:text-white border border-transparent"
                                        )}
                                    >
                                        {/* Active background glowing indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        {chat.latestCode ? (
                                            <Code className="w-4 h-4 text-indigo-400 shrink-0" />
                                        ) : (
                                            <MessageSquare className="w-4 h-4 text-white/30 group-hover:text-indigo-400/50 shrink-0 transition-colors" />
                                        )}
                                        <span className="truncate flex-1 text-xs font-medium">{chat.title}</span>
                                        {chat.latestCode && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWebDevMode(true);
                                                    selectChat(chat.id);
                                                }}
                                                className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-extrabold tracking-wider shrink-0 border border-indigo-500/20 hover:bg-indigo-500/30 transition-all cursor-pointer"
                                            >
                                                Open
                                            </button>
                                        )}
                                        {isActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteChat(chat.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 rounded-lg transition-all ml-1 hover:bg-white/10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Settings */}
            <div className="p-3 border-t border-white/[0.05] space-y-1 bg-[#030305]/60 backdrop-blur-md shrink-0">
                <motion.button
                    onClick={() => openModal('memory')}
                    whileHover={{ scale: 1.01, x: 2 }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl text-xs font-semibold transition-all group cursor-pointer"
                >
                    <Brain className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    <span>Memory Space</span>
                    {enabledMemoryCount > 0 && (
                        <span className="ml-auto text-[9px] bg-indigo-500/25 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">
                            {enabledMemoryCount}
                        </span>
                    )}
                </motion.button>

                <motion.button
                    onClick={() => openModal('apiKey')}
                    whileHover={{ scale: 1.01, x: 2 }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl text-xs font-semibold transition-all group cursor-pointer"
                >
                    <Settings className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    <span>Settings & Keys</span>
                </motion.button>

                <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.01 }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                    <LogOut className="w-4 h-4 text-red-500/60 group-hover:text-red-400" />
                    <span>Sign Out</span>
                </motion.button>
            </div>
        </motion.aside>
    );
}
