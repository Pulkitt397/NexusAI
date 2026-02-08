import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useApp } from '@/context';
import {
    Sparkles, ArrowUp, X, Command, MessageSquare, Wand2, Smartphone,
    ChevronDown, Cpu, Globe, Database, Settings2
} from 'lucide-react';

interface StageActionPanelProps {
    onSendMessage: (content: string) => void;
    placeholder?: string;
    selectedSectionTitle?: string | null;
}

export function StageActionPanel({ onSendMessage, placeholder, selectedSectionTitle }: StageActionPanelProps) {
    const { state, selectProvider, selectModel } = useApp();
    const [input, setInput] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState<'provider' | 'model' | null>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const currentProvider = state.providers.find(p => p.id === state.currentProviderId);
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);

    return (
        <div className="flex flex-col items-center pointer-events-none w-full">
            {/* Context Header */}
            <AnimatePresence>
                {selectedSectionTitle && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="mb-4 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-2xl flex items-center gap-2.5 shadow-2xl shadow-indigo-500/20 pointer-events-auto ring-1 ring-white/5"
                    >
                        <Wand2 className="w-4 h-4 text-indigo-400" />
                        <span className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.15em]">Refining: {selectedSectionTitle}</span>
                        <div className="w-px h-3 bg-white/10 mx-1" />
                        <button
                            onClick={() => {/* Use selectSection(null) via context if needed */ }}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Action Bar */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-3xl bg-[#141417]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] p-3 pointer-events-auto ring-1 ring-white/5 overflow-visible relative"
            >
                {/* Provider/Model Selectors Floating Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: -15 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute bottom-full left-0 right-0 mb-4 bg-[#1c1c21] border border-white/10 rounded-2xl shadow-2xl p-2 z-[100]"
                        >
                            <div className="max-h-64 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1">
                                {isMenuOpen === 'provider' ? (
                                    state.providers.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { selectProvider(p.id); setIsMenuOpen(null); }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                state.currentProviderId === p.id ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-white/50"
                                            )}
                                        >
                                            <Globe className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-bold truncate">{p.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    state.availableModels.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { selectModel(m.id); setIsMenuOpen(null); }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                state.currentModelId === m.id ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-white/50"
                                            )}
                                        >
                                            <Cpu className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-bold truncate">{m.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="relative flex items-end gap-3 px-3 py-1">
                    {/* Selectors */}
                    <div className="flex bg-white/5 rounded-2xl border border-white/5 p-1 mb-1 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(isMenuOpen === 'provider' ? null : 'provider')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all",
                                isMenuOpen === 'provider' ? "bg-white text-black" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            <Database className="w-3.5 h-3.5" />
                            <span className="hidden md:inline uppercase tracking-widest">{currentProvider?.name || 'Provider'}</span>
                            <ChevronDown className="w-3 h-3 opacity-30" />
                        </button>
                        <div className="w-px h-4 bg-white/10 self-center" />
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(isMenuOpen === 'model' ? null : 'model')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all",
                                isMenuOpen === 'model' ? "bg-white text-black" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            <span className="hidden md:inline uppercase tracking-widest">{currentModel?.name.split('/').pop() || 'Model'}</span>
                            <ChevronDown className="w-3 h-3 opacity-30" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[56px] flex items-center">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={placeholder || (state.projectStage === 'intent' ? "What are we building today?" : "Describe changes or refine architecture...")}
                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] font-medium text-white placeholder-white/10 resize-none py-4 custom-scrollbar max-h-40"
                            rows={1}
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 text-[9px] text-white/20 border border-white/5 font-black tracking-tighter">
                            <Command className="w-3 h-3" />
                            <span>K</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={cn(
                                "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-500",
                                input.trim()
                                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-100 rotate-0"
                                    : "bg-white/5 text-white/10 scale-90 rotate-12 opacity-50"
                            )}
                        >
                            <ArrowUp className={cn("w-5 h-5 transition-transform duration-500", input.trim() ? "translate-y-0" : "translate-y-1")} strokeWidth={4} />
                        </button>
                    </div>
                </form>

                {/* Aesthetic Footer (Micro-Actions) */}
                <div className="px-4 pb-2 pt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {[
                            { label: 'Polish UI', icon: Sparkles },
                            { label: 'Responsive', icon: Smartphone },
                            { label: 'Strategy', icon: Settings2 }
                        ].map((action, i) => (
                            <button
                                key={i}
                                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-all text-[10px] font-black text-white/30 hover:text-white/80 whitespace-nowrap group"
                            >
                                <action.icon className="w-3 h-3 group-hover:scale-110 group-hover:text-indigo-400 transition-all" />
                                <span className="uppercase tracking-[0.1em]">{action.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1" />
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/5 text-green-500/40 border border-green-500/10">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-current"
                        />
                        <span className="text-[9px] font-black uppercase tracking-widest">Nexus Active</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


