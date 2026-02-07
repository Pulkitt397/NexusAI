import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Languages, ListRestart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionMenuProps {
    onAction: (action: string, selectedText: string) => void;
}

export function SelectionMenu({ onAction }: SelectionMenuProps) {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Only show if the selection is within a chat message (approximation)
            const container = selection.anchorNode?.parentElement?.closest('.prose');
            if (container) {
                setSelectedText(selection.toString().trim());
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + window.scrollY - 10,
                });
            } else {
                setPosition(null);
            }
        } else {
            setPosition(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
        };
    }, [handleSelection]);

    if (!position) return null;

    const actions = [
        { id: 'explain', icon: Sparkles, label: 'Explain' },
        { id: 'summarize', icon: FileText, label: 'Summarize' },
        { id: 'translate', icon: Languages, label: 'Translate' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 100,
                }}
                className="flex items-center gap-1 p-1 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl"
            >
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => {
                            onAction(action.id, selectedText);
                            setPosition(null);
                            window.getSelection()?.removeAllRanges();
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-[11px] font-medium text-white/70 hover:text-white transition-all whitespace-nowrap"
                    >
                        <action.icon className="w-3.5 h-3.5" />
                        {action.label}
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}
