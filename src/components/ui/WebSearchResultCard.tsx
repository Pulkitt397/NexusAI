import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Search } from 'lucide-react';
import { WebSearchResult } from '@/types';
import { cn } from '@/lib/utils';

interface WebSearchResultCardProps {
    result: WebSearchResult;
}

export function WebSearchResultCard({ result }: WebSearchResultCardProps) {
    return (
        <div className="w-full max-w-3xl my-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl"
            >
                {/* Header Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
                        <Globe className="w-3 h-3" />
                        <span>Web Result</span>
                    </div>
                    <span className="text-xs text-white/40 flex-1 truncate">
                        via {result.source}
                    </span>
                </div>

                {/* Main Content */}
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                    {result.title}
                </h3>

                <div className="text-white/80 text-sm leading-relaxed mb-4">
                    {result.summary}
                </div>

                {/* Related Links */}
                {result.related && result.related.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                            Explore More
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {result.related.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <Search className="w-4 h-4 text-white/30 mt-0.5 group-hover:text-cyan-400 transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-cyan-300/90 font-medium truncate group-hover:text-cyan-300 transition-colors">
                                            {link.text}
                                        </div>
                                        <div className="text-xs text-white/30 truncate mt-0.5 group-hover:text-white/50">
                                            {link.url.replace(/^https?:\/\//, '').split('/')[0]}
                                        </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none" />
            </motion.div>
        </div>
    );
}
