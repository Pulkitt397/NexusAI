import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { motion } from 'framer-motion';
import { WebSearchResultCard } from './WebSearchResultCard';
import { WebSearchResult } from '@/types';

interface ChatMessageProps {
    role: string;
    content: string;
    id: string;
    webResult?: WebSearchResult;
}

export const ChatMessage = memo(({ role, content, id, webResult }: ChatMessageProps) => {
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
                "relative max-w-[85%] md:max-w-[80%] w-full",
                isUser ? "items-end" : "items-start"
            )}>
                {webResult ? (
                    <WebSearchResultCard result={webResult} />
                ) : (
                    <div className={cn(
                        "rounded-2xl px-5 py-4 text-sm md:text-[15px] leading-relaxed shadow-sm w-fit",
                        isUser
                            ? "bg-[#27272a] text-white/95 border border-white/5 ml-auto"
                            : "glass-panel text-white/90"
                    )}>
                        {isUser ? (
                            <div className="whitespace-pre-wrap">{content}</div>
                        ) : (
                            <MessageContent content={content} />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return prev.content === next.content && prev.role === next.role && prev.id === next.id && prev.webResult === next.webResult;
});
