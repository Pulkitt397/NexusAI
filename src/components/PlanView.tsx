
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
        <div className="h-full flex flex-col bg-transparent text-white overflow-hidden selection:bg-indigo-500/30">
            {/* Header / Engine Status */}
            <div className="p-8 border-b border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex items-center justify-between mb-6 relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                            <BrainCircuit className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                Nexus Core Plan
                            </h1>
                            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Autonomous Agent Memory & Strategy</p>
                        </div>
                    </div>

                    {state.stage === 'build' && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Building Sequence</span>
                        </div>
                    )}
                </div>

                {/* Intent Summary - Flattened Cards */}
                {state.intent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group/card hover:bg-white/[0.04] transition-all">
                            <div className="text-[10px] text-blue-400 font-black tracking-[0.2em] mb-2 uppercase opacity-60">Objective</div>
                            <div className="text-[13px] text-white/90 leading-relaxed font-medium">{state.intent.goal}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group/card hover:bg-white/[0.04] transition-all">
                            <div className="text-[10px] text-purple-400 font-black tracking-[0.2em] mb-2 uppercase opacity-60">Target Audience</div>
                            <div className="text-[13px] text-white/90 leading-relaxed font-medium">{state.intent.audience}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Plan Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto p-8 space-y-12">
                    {state.stage === 'intent' && !state.intent ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <BrainCircuit className="w-12 h-12 text-indigo-400 relative" />
                            </div>
                            <h2 className="text-3xl font-black mb-4 tracking-tight">
                                Start your vision.
                            </h2>
                            <p className="text-sm text-white/30 leading-relaxed mb-10 max-w-sm">
                                I'm ready to architect and build your web application. Just describe what you need in the command bar below.
                            </p>
                        </div>
                    ) : !state.architecture ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-white/30 text-center">
                            <div className="relative mb-6">
                                <Loader2 className="w-16 h-16 animate-spin text-indigo-500/20" />
                                <BrainCircuit className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="font-black text-white/60 tracking-widest uppercase text-xs">Architecting Solution</p>
                            <p className="text-[11px] mt-2 text-white/20 font-medium">Analyzing multidimensional intent and mapping site DNA...</p>
                        </div>
                    ) : (
                        <>
                            {/* Sections List */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                            <LayoutTemplate className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">
                                            Architecture Blueprint
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 tracking-widest">
                                        {state.architecture.sections.length} CORE BLOCKS
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
                            </section>

                            {/* Visual & Responsive Strategy */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-6 rounded-[32px] border border-white/5 bg-white/[0.01] backdrop-blur-xl hover:bg-white/[0.03] transition-all hover:border-indigo-500/30 group"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                            <Palette className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Visual DNA</h3>
                                    </div>

                                    {state.designSystem ? (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                {Object.entries(state.designSystem.color_palette).map(([key, color], i) => (
                                                    <div key={key} className="group/swatch relative">
                                                        <div className="w-12 h-12 rounded-2xl shadow-2xl border border-white/10 transition-transform group-hover/swatch:-translate-y-1" style={{ backgroundColor: color as string }} />
                                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 opacity-0 group-hover/swatch:opacity-100 transition-opacity uppercase">{key}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/60 leading-relaxed font-medium italic">
                                                "System uses <span className="text-white not-italic font-black mx-1">{state.designSystem.typography.heading_font}</span> for impact and <span className="text-white not-italic font-bold mx-1">{state.designSystem.typography.body_font}</span> for legibility."
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-white/20 italic text-[11px]">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Defining style tokens...
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-6 rounded-[32px] border border-white/5 bg-white/[0.01] backdrop-blur-xl hover:bg-white/[0.03] transition-all hover:border-blue-500/30 group"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                            <Smartphone className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Responsivity</h3>
                                    </div>
                                    <p className="text-[12px] text-white/50 leading-relaxed font-medium bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                        {state.architecture.responsive_rules || "Awaiting core structural analysis to define breakpoint fluidity..."}
                                    </p>
                                </motion.div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionItem({ section, state, index }: { section: SectionSpec, state: BuilderState, index: number }) {
    const [isOpen, setIsOpen] = React.useState(true);
    const uxStep = state.uxJourney?.steps.find(s => s.sectionId === section.id);
    const assets = state.assets?.section_assets.find(a => a.sectionId === section.id);

    // Status Logic for Sequential Build
    const isBuilt = state.architecture?.sections.find(s => s.id === section.id)?.priority === 'high' || !!(state as any).sections?.find((s: any) => s.id === section.id && s.status === 'complete');
    const isBuilding = !isBuilt && state.stage === 'build';

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "rounded-[24px] border transition-all duration-500 relative group/item",
                isBuilt ? "bg-green-500/[0.02] border-green-500/20" :
                    isBuilding ? "bg-indigo-500/[0.05] border-indigo-500/40 shadow-[0_0_30px_rgba(79,70,229,0.1)]" :
                        "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
            )}
        >
            {isBuilding && (
                <div className="absolute inset-0 overflow-hidden rounded-[24px]">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent w-1/2"
                    />
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-5 p-5 text-left relative z-10"
            >
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl border-2 text-[11px] font-black transition-all duration-500",
                    isBuilt ? "border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/20" :
                        isBuilding ? "border-indigo-500 bg-indigo-500 text-white animate-pulse" :
                            "border-white/10 text-white/30"
                )}>
                    {isBuilt ? <CheckCircle2 className="w-4 h-4" strokeWidth={3} /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={cn(
                            "text-sm font-black tracking-tight",
                            isBuilt ? "text-green-100" : "text-white"
                        )}>
                            {section.name || section.id.toUpperCase()}
                        </h3>
                        {isBuilding && <span className="text-[8px] font-black px-2 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-widest animate-pulse">Encoding</span>}
                    </div>
                    <p className="text-[11px] text-white/30 font-medium truncate mt-0.5">{section.purpose}</p>
                </div>

                <div className="flex items-center gap-4">
                    <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform duration-500", !isOpen && "-rotate-90")} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="px-5 pb-5 pt-0 space-y-4">
                            <div className="h-px bg-white/5 w-full mb-4" />

                            {/* UX Strategy */}
                            <div className="flex items-start gap-4">
                                <div className={cn("p-1.5 rounded-lg", uxStep ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-white/10")}>
                                    <Share2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1.5">UX Logic</span>
                                    {uxStep ? (
                                        <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                                            <span className="text-white font-black mr-2">[{uxStep.role.toUpperCase()}]</span>
                                            {uxStep.user_goal}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] text-white/10 italic">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Developing interaction model...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assets */}
                            <div className="flex items-start gap-4">
                                <div className={cn("p-1.5 rounded-lg", assets ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/10")}>
                                    <ImageIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1.5">Asset Inventory</span>
                                    {assets ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {assets.image_prompts.slice(0, 2).map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] text-white/40 truncate font-bold">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] text-white/10 italic">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Sourcing visual components...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
