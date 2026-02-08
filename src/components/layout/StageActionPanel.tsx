import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowUp, X, Command, MessageSquare, Wand2 } from 'lucide-react';

interface StageActionPanelProps {
    onSendMessage: (content: string) => void;
    placeholder?: string;
    selectedSectionTitle?: string | null;
}

export function StageActionPanel({ onSendMessage, placeholder, selectedSectionTitle }: StageActionPanelProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="flex flex-col items-center pointer-events-none">
            <AnimatePresence>
                {selectedSectionTitle && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="mb-3 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-indigo-500/10 pointer-events-auto"
                    >
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Refining: {selectedSectionTitle}</span>
                        <button
                            onClick={() => {/* Clear selection logic via parent */ }}
                            className="bg-white/10 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-2.5 h-2.5 text-white/50" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="w-full max-w-2xl bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 pointer-events-auto ring-1 ring-white/5"
            >
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2 px-2 py-1">
                    <div className="flex-1 min-h-[44px] flex items-center">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={placeholder || "Ask Nexus to build or refine anything..."}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-white/20 resize-none py-3 custom-scrollbar max-h-32"
                            rows={1}
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] text-white/30 border border-white/5 font-medium">
                            <Command className="w-2.5 h-2.5" />
                            <span>K</span>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                input.trim()
                                    ? "bg-white text-black shadow-lg shadow-white/10 scale-100"
                                    : "bg-white/5 text-white/20 scale-95"
                            )}
                        >
                            <ArrowUp className="w-4 h-4" strokeWidth={3} />
                        </button>
                    </div>
                </form>

                {/* Micro-Actions */}
                <div className="px-3 pb-2 pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { label: 'Add Logic', icon: Sparkles },
                        { label: 'Change Theme', icon: Wand2 },
                        { label: 'Make Responsive', icon: Smartphone }
                    ].map((action, i) => (
                        <button
                            key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[10px] font-medium text-white/40 hover:text-white/70 whitespace-nowrap"
                        >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-white/20">
                        <MessageSquare className="w-3 h-3" />
                        <span>Artifact Ready</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Internal icon import for demo consistency
function Smartphone(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
        </svg>
    )
}
