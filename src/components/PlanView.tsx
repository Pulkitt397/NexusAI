
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Circle, Clock, BrainCircuit,
    LayoutTemplate, Smartphone, Palette, Share2, Image as ImageIcon,
    ChevronRight, ChevronDown
} from 'lucide-react';
import { BuilderState, SectionSpec } from '@/types/builderTypes';
import { cn } from '@/lib/utils';

interface PlanViewProps {
    state: BuilderState;
}

export function PlanView({ state }: PlanViewProps) {
    return (
        <div className="h-full flex flex-col bg-[#0c0c0e] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Project Brain</h1>
                        <p className="text-sm text-white/40">Autonomous Agent Plan & Memory</p>
                    </div>
                </div>

                {/* Intent Summary */}
                {state.intent && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-blue-400 font-medium mb-1">GOAL</div>
                            <div className="text-sm text-white/90">{state.intent.goal}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-purple-400 font-medium mb-1">AUDIENCE</div>
                            <div className="text-sm text-white/90">{state.intent.audience}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Plan Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {!state.architecture ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 text-center">
                        <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
                        <p>Waiting for instructions...</p>
                        <p className="text-xs mt-2">Type a prompt in the Chat to start the Brain.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Sections List */}
                        <div>
                            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4" />
                                Site Architecture
                            </h2>
                            <div className="space-y-3">
                                {state.architecture.sections.map((section, idx) => (
                                    <SectionItem
                                        key={section.id}
                                        section={section}
                                        state={state}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Design System Status */}
                        <div>
                            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Design System
                            </h2>
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                {state.designSystem ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Generated successfully</span>
                                        <div className="flex gap-2 ml-4">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.designSystem.color_palette.primary }} title="Primary" />
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.designSystem.color_palette.secondary }} title="Secondary" />
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.designSystem.color_palette.background }} title="Background" />
                                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: state.designSystem.color_palette.surface }} title="Surface" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-white/30">
                                        <Circle className="w-5 h-5" />
                                        <span>Pending design generation...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionItem({ section, state, index }: { section: SectionSpec, state: BuilderState, index: number }) {
    const [isOpen, setIsOpen] = React.useState(true);

    // Derive status/content from state
    const uxStep = state.uxJourney?.steps.find(s => s.sectionId === section.id);
    const assets = state.assets?.section_assets.find(a => a.sectionId === section.id);
    const hasCode = true; // Simplified for now, in real app check file existence

    // Determine overall section status
    const isComplete = !!(uxStep && assets && state.designSystem); // Simplified logic
    const isProcessing = !isComplete && state.stage !== 'idle';

    return (
        <div className="rounded-xl border border-white/10 bg-[#121214] overflow-hidden transition-all hover:border-white/20">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
            >
                <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold",
                    isComplete ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/20 text-white/40"
                )}>
                    {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90">{section.name || section.type}</h3>
                    <p className="text-xs text-white/40">{section.purpose}</p>
                </div>

                <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform", !isOpen && "-rotate-90")} />
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-4 space-y-3">

                            {/* UX Strategy */}
                            <div className="flex items-start gap-3 text-xs">
                                <Share2 className={cn("w-4 h-4 mt-0.5", uxStep ? "text-orange-400" : "text-white/20")} />
                                <div>
                                    <span className="text-white/40 block mb-0.5">UX Strategy</span>
                                    {uxStep ? (
                                        <div className="text-white/80">
                                            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 mr-2 uppercase text-[10px] tracking-wider">
                                                {uxStep.role}
                                            </span>
                                            {uxStep.user_goal}
                                        </div>
                                    ) : (
                                        <span className="text-white/20 italic">Thinking about user journey...</span>
                                    )}
                                </div>
                            </div>

                            {/* Assets */}
                            <div className="flex items-start gap-3 text-xs">
                                <ImageIcon className={cn("w-4 h-4 mt-0.5", assets ? "text-green-400" : "text-white/20")} />
                                <div>
                                    <span className="text-white/40 block mb-0.5">Assets Sourced</span>
                                    {assets ? (
                                        <div className="text-white/80 space-y-1">
                                            {assets.image_prompts.map((p, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-green-500" />
                                                    <span className="truncate max-w-[300px]">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-white/20 italic">Sourcing visuals...</span>
                                    )}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
