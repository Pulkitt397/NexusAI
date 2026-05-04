import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { motion } from 'framer-motion';
import { WebSearchResultCard } from './WebSearchResultCard';
import { WebSearchResult } from '@/types';
import { FileDown, Volume2, VolumeX } from 'lucide-react';

interface ChatMessageProps {
    role: string;
    content: string;
    id: string;
    webResult?: WebSearchResult;
    pdfUrl?: string;
}

export const ChatMessage = memo(({ role, content, id, webResult, pdfUrl }: ChatMessageProps) => {
    const isUser = role === 'user';
    const [isPlaying, setIsPlaying] = React.useState(false);

    const toggleSpeech = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        // Clean markdown for better speech
        const plainText = content
            .replace(/```[\s\S]*?```/g, ' [code block] ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/[#*_]/g, '');

        utterance.text = plainText;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group flex gap-4 md:gap-6 w-full py-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
            <div className={cn(
                "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-semibold tracking-wide shadow-lg",
                !isUser
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                    : "bg-white/10 text-white/70 border border-white/10"
            )}>
                    {!isUser ? "AI" : "YOU"}
                </div>
                {!isUser && (
                    <button
                        onClick={toggleSpeech}
                        className={cn(
                            "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                            isPlaying ? "bg-indigo-500/20 text-indigo-400 opacity-100" : "text-white/30 hover:text-white hover:bg-white/5"
                        )}
                        title={isPlaying ? "Stop listening" : "Listen to response"}
                    >
                        {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                )}
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
                    ? "bg-white/10 text-white/90 border border-white/10 ml-auto text-right"
                    : "bg-white/5 text-white/80 border border-white/5"
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
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all hover:scale-[1.02] shadow-xl group/pdf"
                    >
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/pdf:bg-indigo-500 group-hover/pdf:text-white transition-colors">
                            <FileDown className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span>Ready to download</span>
                            <span className="text-[10px] text-white/30 font-normal uppercase tracking-widest mt-0.5">NexusAI Export . PDF</span>
                        </div>
                    </motion.a>
                )}
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return prev.content === next.content && prev.role === next.role && prev.id === next.id && prev.webResult === next.webResult && prev.pdfUrl === next.pdfUrl;
});
