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
                                                "flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                                                state.currentProviderId === p.id ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-white/50"
                                            )}
                                        >
                                            {p.id === 'ollama' ? (
                                                <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-2-11c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm4 0c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm-2 7c-2.206 0-4-1.794-4-4 0-.276.224-.5.5-.5s.5.224.5.5c0 1.654 1.346 3 3 3s3-1.346 3-3c0-.276.224-.5.5-.5s.5.224.5.5c0 2.206-1.794 4-4 4z" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <Globe className="w-4 h-4 shrink-0" />
                                            )}
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
                    {/* Compact Selectors */}
                    <div className="flex bg-white/5 rounded-2xl border border-white/5 p-1 mb-1.5 shadow-inner shrink-0 scale-90 origin-left">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(isMenuOpen === 'provider' ? null : 'provider')}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                                isMenuOpen === 'provider' ? "bg-white text-black" : "text-white/40 hover:text-white/70"
                            )}
                            title={currentProvider?.name || 'Provider'}
                        >
                            <Database className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-white/10 self-center mx-0.5" />
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(isMenuOpen === 'model' ? null : 'model')}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                                isMenuOpen === 'model' ? "bg-white text-black" : "text-white/40 hover:text-white/70"
                            )}
                            title={currentModel?.name || 'Model'}
                        >
                            <Cpu className="w-4 h-4" />
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
                            placeholder={placeholder || (state.projectStage === 'intent' ? "What's the vision for your app?" : "Describe any changes or refinements...")}
                            className="w-full bg-transparent border-none focus:ring-0 text-[16px] font-medium text-white placeholder-white/20 resize-none py-4 custom-scrollbar max-h-48"
                            rows={1}
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-2 shrink-0">
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={cn(
                                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500",
                                input.trim()
                                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-100"
                                    : "bg-white/5 text-white/10 scale-90 opacity-40 shrink-0"
                            )}
                        >
                            <ArrowUp className={cn("w-6 h-6 transition-transform duration-500", input.trim() ? "translate-y-0" : "translate-y-1")} strokeWidth={4} />
                        </button>
                    </div>
                </form>

                {/* Functional Micro-Actions */}
                <div className="px-4 pb-2 pt-1 flex items-center gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {[
                            { label: 'Polish UI', icon: Sparkles, action: "Apply a professional, high-end UI polish to this section." },
                            { label: 'Responsive', icon: Smartphone, action: "Ensure this section looks great on mobile, tablet, and desktop." },
                            { label: 'Add Logic', icon: Settings2, action: "Implement interactive logic and dynamic behavior for this component." }
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(prev => prev ? `${prev} ${action.action}` : action.action)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all text-[10px] font-black text-white/40 hover:text-white/90 whitespace-nowrap group active:scale-95"
                            >
                                <action.icon className="w-3.5 h-3.5 group-hover:scale-110 group-hover:text-indigo-400 transition-all" />
                                <span className="uppercase tracking-[0.15em]">{action.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1" />
                    <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-indigo-500/[0.03] text-indigo-400/50 border border-indigo-500/10">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Nexus Console</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


