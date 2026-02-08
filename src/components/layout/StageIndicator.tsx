import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProjectStage } from '@/types';
import { Check, ChevronRight } from 'lucide-react';

interface StageIndicatorProps {
    currentStage: ProjectStage;
}

const STAGES: { id: ProjectStage; label: string }[] = [
    { id: 'intent', label: 'Intent' },
    { id: 'architecture', label: 'Planning' },
    { id: 'build', label: 'Building' },
    { id: 'refine', label: 'Review' }
];

export function StageIndicator({ currentStage }: StageIndicatorProps) {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {STAGES.map((stage, idx) => {
                const isActive = stage.id === currentStage;
                const isCompleted = idx < currentIndex;

                return (
                    <React.Fragment key={stage.id}>
                        <div className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-500",
                            isActive ? "bg-indigo-500/10 border border-indigo-500/20" : "opacity-60"
                        )}>
                            <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black transition-all duration-500 shrink-0",
                                isCompleted ? "bg-green-500 text-white shadow-lg shadow-green-500/20" :
                                    isActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-110" :
                                        "bg-white/5 text-white/20 border border-white/10"
                            )}>
                                {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={4} /> : idx + 1}
                            </div>
                            <span className={cn(
                                "text-[11px] font-bold tracking-tight whitespace-nowrap transition-all duration-500",
                                isActive ? "text-white translate-x-0" : "text-white/20 group-hover:text-white/40"
                            )}>
                                {stage.label.toUpperCase()}
                            </span>
                        </div>
                        {idx < STAGES.length - 1 && (
                            <div className="w-4 h-[1px] bg-white/5 mx-0.5 shrink-0" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
