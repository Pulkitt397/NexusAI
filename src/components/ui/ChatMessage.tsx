import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { motion } from 'framer-motion';
import { WebSearchResultCard } from './WebSearchResultCard';
import { WebSearchResult } from '@/types';
import { FileDown } from 'lucide-react';

interface ChatMessageProps {
    role: string;
    content: string;
    id: string;
    webResult?: WebSearchResult;
    pdfUrl?: string;
}

export const ChatMessage = memo(({ role, content, id, webResult, pdfUrl }: ChatMessageProps) => {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group flex gap-4 md:gap-6 w-full py-4", // constant padding for list
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-medium tracking-wide shadow-lg",
                !isUser
                    ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-500/20"
                    : "bg-white/10 text-white/70 border border-white/5"
            )}>
                {!isUser ? "AI" : "YOU"}
            </div>

            {/* Message Card */}
            <div className={cn(
                "relative max-w-[85%] md:max-w-[80%] flex flex-col gap-3",
                isUser ? "items-end" : "items-start"
            )}>
                {webResult && <WebSearchResultCard result={webResult} />}

                <div className={cn(
                    "rounded-2xl px-5 py-4 text-sm md:text-[15px] leading-relaxed shadow-sm w-fit max-w-full overflow-hidden break-words",
                    isUser
                        ? "bg-[#27272a] text-white/95 border border-white/5 ml-auto text-right"
                        : "glass-panel text-white/90"
                )}>
                    {isUser ? (
                        <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                        <MessageContent content={content} />
                    )}
                </div>

                {pdfUrl && !isUser && (
                    <motion.a
                        href={pdfUrl}
                        download={`NexusAI_Export_${Date.now()}.pdf`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-all hover:scale-[1.02] shadow-xl backdrop-blur-md group/pdf"
                    >
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 group-hover/pdf:bg-red-500 group-hover/pdf:text-white transition-colors">
                            <FileDown className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span>Ready to download</span>
                            <span className="text-[10px] text-white/40 font-normal uppercase tracking-widest mt-0.5">NexusAI Export . PDF</span>
                        </div>
                    </motion.a>
                )}
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return prev.content === next.content && prev.role === next.role && prev.id === next.id && prev.webResult === next.webResult && prev.pdfUrl === next.pdfUrl;
});
