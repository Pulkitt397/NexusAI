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
    { id: 'architecture', label: 'Architecture' },
    { id: 'build', label: 'Build' },
    { id: 'refine', label: 'Refine' },
    { id: 'export', label: 'Export' }
];

export function StageIndicator({ currentStage }: StageIndicatorProps) {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {STAGES.map((stage, idx) => {
                const isActive = stage.id === currentStage;
                const isCompleted = idx < currentIndex;

                return (
                    <React.Fragment key={stage.id}>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all duration-300 shrink-0",
                                isCompleted ? "bg-green-500 text-white" :
                                    isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/20" :
                                        "bg-white/5 text-white/30 border border-white/10"
                            )}>
                                {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                            </div>
                            <span className={cn(
                                "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                                isActive ? "text-white" : "text-white/30"
                            )}>
                                {stage.label}
                            </span>
                        </div>
                        {idx < STAGES.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-white/10 mx-1 shrink-0" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
