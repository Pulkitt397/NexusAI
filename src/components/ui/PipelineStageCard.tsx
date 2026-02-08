
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Circle, Smartphone, Palette, LayoutTemplate, Share2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteIntent, SiteArchitecture, DesignSystem, UXJourney, AssetPlan } from '@/types/builderTypes';

interface PipelineStageCardProps {
    content: string;
}

export function PipelineStageCard({ content }: PipelineStageCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    try {
        const data = JSON.parse(content);
        const type = data.type; // 'INTENT', 'ARCHITECTURE', 'UX', 'ASSETS', 'DESIGN'
        const payload = data.payload;

        if (!type || !payload) return null;

        const getIcon = () => {
            if (type === 'INTENT') return <Smartphone className="w-5 h-5 text-blue-400" />;
            if (type === 'ARCHITECTURE') return <LayoutTemplate className="w-5 h-5 text-purple-400" />;
            if (type === 'UX') return <Share2 className="w-5 h-5 text-orange-400" />;
            if (type === 'ASSETS') return <ImageIcon className="w-5 h-5 text-green-400" />;
            if (type === 'DESIGN') return <Palette className="w-5 h-5 text-pink-400" />;
            return <Circle className="w-5 h-5 text-gray-400" />;
        };

        const getTitle = () => {
            if (type === 'INTENT') return "Intent Identified";
            if (type === 'ARCHITECTURE') return "Architecture Planned";
            if (type === 'UX') return "UX Flow Designed";
            if (type === 'ASSETS') return "Assets Sourced";
            if (type === 'DESIGN') return "Design System Generated";
            return "Processing";
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-[#121214] overflow-hidden my-2"
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            {getIcon()}
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-semibold text-white/90">{getTitle()}</h3>
                            <p className="text-xs text-white/40">
                                {type === 'INTENT' && "Goal, Audience, Tone"}
                                {type === 'ARCHITECTURE' && `${(payload as SiteArchitecture).sections?.length || 0} Sections`}
                                {type === 'UX' && "Strategy, User Goals, Triggers"}
                                {type === 'ASSETS' && `${(payload as AssetPlan).section_assets?.length || 0} Assets Generated`}
                                {type === 'DESIGN' && "Colors, Typography, Spacing"}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform", isExpanded && "rotate-180")} />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5 bg-black/20"
                        >
                            <div className="p-4 text-xs font-mono text-white/60 overflow-x-auto">
                                <pre>{JSON.stringify(payload, null, 2)}</pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    } catch (e) {
        return null; // Fallback for invalid JSON
    }
}
