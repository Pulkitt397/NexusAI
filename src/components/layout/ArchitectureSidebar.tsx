import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProjectSection } from '@/types';
import {
    LayoutTemplate,
    CheckCircle2,
    Circle,
    Loader2,
    AlertCircle,
    ChevronRight,
    GripVertical
} from 'lucide-react';

interface ArchitectureSidebarProps {
    sections: ProjectSection[];
    selectedSectionId: string | null;
    onSelectSection: (id: string | null) => void;
}

export function ArchitectureSidebar({ sections, selectedSectionId, onSelectSection }: ArchitectureSidebarProps) {
    return (
        <div className="flex flex-col h-full bg-[#09090b] text-white select-none">
            <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <LayoutTemplate className="w-3 h-3" />
                    Architecture
                </span>
                <span className="text-[10px] text-white/20">{sections.length} Sections</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
                {sections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Circle className="w-5 h-5 text-white/10" />
                        </div>
                        <p className="text-[11px] text-white/30 italic">Waiting for architecture layout...</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sections.sort((a, b) => a.order - b.order).map((section) => {
                            const isActive = selectedSectionId === section.id;
                            const Icon = section.status === 'complete' ? CheckCircle2 :
                                section.status === 'generating' ? Loader2 :
                                    section.status === 'error' ? AlertCircle :
                                        Circle;

                            return (
                                <motion.button
                                    key={section.id}
                                    layout
                                    onClick={() => onSelectSection(isActive ? null : section.id)}
                                    className={cn(
                                        "w-full group flex items-start gap-3 p-3 rounded-lg text-left transition-all relative overflow-hidden",
                                        isActive
                                            ? "bg-indigo-600/10 border border-indigo-500/20 ring-1 ring-indigo-500/10"
                                            : "hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                                        />
                                    )}

                                    <Icon className={cn(
                                        "w-4 h-4 mt-0.5 shrink-0",
                                        section.status === 'complete' ? "text-green-400" :
                                            section.status === 'generating' ? "text-indigo-400 animate-spin" :
                                                section.status === 'error' ? "text-red-400" :
                                                    "text-white/20"
                                    )} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn(
                                                "text-[13px] font-medium truncate",
                                                isActive ? "text-white" : "text-white/70 group-hover:text-white"
                                            )}>
                                                {section.title}
                                            </span>
                                            {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
                                        </div>
                                        <p className={cn(
                                            "text-[10px] leading-relaxed line-clamp-2 mt-0.5 transition-colors",
                                            isActive ? "text-indigo-200/60" : "text-white/30"
                                        )}>
                                            {section.description}
                                        </p>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-white/5 bg-[#09090b]/80 backdrop-blur-md">
                <button
                    disabled={sections.length === 0}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-[11px] font-bold shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20 flex items-center justify-center gap-2"
                >
                    Build All Sections
                </button>
            </div>
        </div>
    );
}
