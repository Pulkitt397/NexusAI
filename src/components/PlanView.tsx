
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Circle, Clock, BrainCircuit,
    LayoutTemplate, Smartphone, Palette, Share2, Image as ImageIcon,
    ChevronRight, ChevronDown, Loader2
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
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {state.stage === 'intent' && !state.intent ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
                            <BrainCircuit className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                            What are we building today?
                        </h2>
                        <p className="text-sm text-white/40 leading-relaxed mb-8">
                            Describe your vision in the chat to start the builder pipeline. I'll help you architect, design, and build your application from scratch.
                        </p>
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {[
                                "A premium SaaS landing page",
                                "A minimalist portfolio site",
                                "A complex web application dashboard"
                            ].map((suggestion, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:border-white/20 transition-all cursor-default text-left flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : !state.architecture ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 text-center">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-indigo-500/40" />
                        <p className="font-medium text-white/60">Architecting your solution...</p>
                        <p className="text-xs mt-2 text-white/30">Analyzing intent and mapping site structure.</p>
                    </div>
                ) : (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        {/* Sections List */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4 text-indigo-400" />
                                    Site Architecture
                                </h2>
                                <div className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                                    {state.architecture.sections.length} BLOCKS
                                </div>
                            </div>

                            <div className="space-y-4">
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

                        {/* Visual Strategy Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-pink-400" />
                                    Visual Identity
                                </h3>
                                {state.designSystem ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            {Object.entries(state.designSystem.color_palette).map(([key, color]) => (
                                                <div key={key} className="flex flex-col items-center gap-1.5">
                                                    <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10" style={{ backgroundColor: color as string }} />
                                                    <span className="text-[9px] text-white/30 font-bold uppercase">{key.charAt(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-[11px] text-white/60 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                                            Using <span className="text-white font-bold">{state.designSystem.typography.heading_font}</span> for headings and <span className="text-white font-bold">{state.designSystem.typography.body_font}</span> for body text.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-white/20 italic text-xs">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-dashed border-white/10" />
                                        Generating style tokens...
                                    </div>
                                )}
                            </div>

                            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-blue-400" />
                                    Responsive Strategy
                                </h3>
                                <div className="text-[11px] text-white/50 leading-relaxed italic">
                                    {state.architecture.responsive_rules || "Awaiting structural analysis to define breakpoints and layout fluidity..."}
                                </div>
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
