// Memory Modal - View, Add, Edit, Delete Memories
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context';
import { cn } from '@/lib/utils';
import type { Memory } from '@/types';
import { generateId } from '@/db';

interface MemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
    const { state, addMemory, deleteMemory, toggleMemoryItem, toggleMemoryEnabled } = useApp();
    const [view, setView] = useState<'list' | 'add'>('list');
    const [newMemory, setNewMemory] = useState({ type: 'fact' as Memory['type'], title: '', content: '' });

    const handleAddMemory = async () => {
        if (!newMemory.title.trim() || !newMemory.content.trim()) return;

        const memory: Memory = {
            id: generateId(),
            type: newMemory.type,
            title: newMemory.title,
            content: newMemory.content,
            enabled: true,
            createdAt: new Date().toISOString()
        };

        await addMemory(memory);
        setNewMemory({ type: 'fact', title: '', content: '' });
        setView('list');
    };

    if (!isOpen) return null;

    const enabledCount = state.memories.filter(m => m.enabled).length;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-lg mx-4 max-h-[80vh] bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-violet-400" />
                            <h2 className="text-lg font-semibold text-white">
                                {view === 'list' ? 'Memory Store' : 'Add Memory'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/40 hover:text-white/80 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {view === 'list' ? (
                            <div className="space-y-4">
                                {/* Memory toggle */}
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div>
                                        <p className="text-sm text-white/80">Memory Injection</p>
                                        <p className="text-xs text-white/40">
                                            {enabledCount} memories active
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleMemoryEnabled}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            state.memoryEnabled ? "bg-violet-500" : "bg-white/20"
                                        )}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                            animate={{ left: state.memoryEnabled ? '26px' : '4px' }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>

                                {/* Add button */}
                                <button
                                    onClick={() => setView('add')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Memory
                                </button>

                                {/* Memory list */}
                                {state.memories.length === 0 ? (
                                    <p className="text-center text-white/40 text-sm py-8">
                                        No memories yet. Say "remember this" in chat to auto-save.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {state.memories.map((memory) => (
                                            <motion.div
                                                key={memory.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "p-4 rounded-lg border transition-all",
                                                    memory.enabled
                                                        ? "bg-violet-500/10 border-violet-500/30"
                                                        : "bg-white/5 border-white/10 opacity-60"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-white text-sm">
                                                                {memory.title}
                                                            </span>
                                                            <span className={cn(
                                                                "text-[10px] px-1.5 py-0.5 rounded",
                                                                memory.type === 'user_profile' ? "bg-violet-500/30 text-violet-300" :
                                                                    memory.type === 'preference' ? "bg-cyan-500/30 text-cyan-300" :
                                                                        "bg-green-500/30 text-green-300"
                                                            )}>
                                                                {memory.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/60 truncate">
                                                            {memory.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleMemoryItem(memory.id)}
                                                            className={cn(
                                                                "w-8 h-5 rounded-full transition-colors relative",
                                                                memory.enabled ? "bg-violet-500" : "bg-white/20"
                                                            )}
                                                        >
                                                            <motion.div
                                                                className="absolute top-0.5 w-4 h-4 bg-white rounded-full"
                                                                animate={{ left: memory.enabled ? '14px' : '2px' }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteMemory(memory.id)}
                                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Type select */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Type</label>
                                    <select
                                        value={newMemory.type}
                                        onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as Memory['type'] })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    >
                                        <option value="user_profile">User Profile</option>
                                        <option value="fact">Fact</option>
                                        <option value="preference">Preference</option>
                                    </select>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Title</label>
                                    <input
                                        type="text"
                                        value={newMemory.title}
                                        onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                                        placeholder="e.g., Name, Favorite language"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Content</label>
                                    <textarea
                                        value={newMemory.content}
                                        onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                                        placeholder="What should I remember?"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setView('list')}
                                        className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMemory}
                                        disabled={!newMemory.title.trim() || !newMemory.content.trim()}
                                        className={cn(
                                            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                            newMemory.title.trim() && newMemory.content.trim()
                                                ? "bg-violet-500 hover:bg-violet-600 text-white"
                                                : "bg-white/10 text-white/40 cursor-not-allowed"
                                        )}
                                    >
                                        Save Memory
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
