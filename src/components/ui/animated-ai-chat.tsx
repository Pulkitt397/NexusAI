"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    SendIcon,
    LoaderIcon,
    Brain,
    Settings,
    Sparkles,
    Image as ImageIcon,
    Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { MessageContent } from "./MessageContent";
import { ChatMessage } from "./ChatMessage";
import { Virtuoso, type VirtuosoHandle, type Components } from 'react-virtuoso';

import { WebSearchResult, SearchMode } from "@/types";

interface MessageItem {
    role: string;
    content: string;
    id: string;
    webResult?: WebSearchResult;
    pdfUrl?: string; // Added field
}

interface ChatContext {
    isStreaming: boolean;
    isSearching: boolean;
    streamingContent: string;
    searchMode?: SearchMode;
}

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

// --- HOOKS ---

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

// --- STABLE COMPONENTS (Outside main render loop) ---

// 1. Stable Footer Component (Prevents re-mounting/blinking)
const StreamingFooter = ({ context }: { context?: ChatContext }) => {
    const { isStreaming, streamingContent } = context || {};

    if (!isStreaming) return <div className="pb-32" />; // Just padding when not streaming

    return (
        <div className="px-4 md:px-0 max-w-3xl mx-auto pb-32">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 md:gap-6 py-4"
            >
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-medium tracking-wide bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 mt-1">
                    AI
                </div>
                <div className="max-w-[85%] md:max-w-[80%] rounded-2xl glass-panel px-5 py-4 text-sm md:text-[15px] leading-relaxed border border-white/5 text-white/90 min-h-[60px]">
                    {streamingContent ? (
                        <MessageContent content={streamingContent} isStreaming={true} />
                    ) : (
                        <div className="flex items-center gap-2 text-white/40 h-full py-1">
                            <LoaderIcon className={cn("w-4 h-4 animate-spin", context?.isSearching ? "text-cyan-400" : "text-violet-400")} />
                            <span className="text-xs font-medium tracking-wide">
                                {context?.isSearching ? 'Searching web...' : 'Thinking...'}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// 2. Stable Header Component
const ChatHeader = () => <div className="h-8" />;

// --- MAIN COMPONENT ---

interface AnimatedAIChatProps {
    onSendMessage: (message: string) => void;
    isStreaming: boolean;
    isSearching: boolean;
    streamingContent: string;
    messages: Array<MessageItem>;
    onOpenMemory: () => void;
    onOpenSettings: () => void;
    memoryCount: number;
    currentModel: string | null;
    placeholder?: string;
    onEnhance?: (input: string) => Promise<string>;
    searchMode: SearchMode;
    onSetSearchMode: (mode: SearchMode) => void;
}

export function AnimatedAIChat({
    onSendMessage,
    isStreaming,
    streamingContent,
    messages,
    onOpenMemory,
    onOpenSettings,
    memoryCount,
    currentModel,
    placeholder = "Describe what you want to build...",
    onEnhance,
    searchMode,
    onSetSearchMode,
    isSearching
}: AnimatedAIChatProps) {
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    // Auto-scroll state
    const [isAtBottom, setIsAtBottom] = useState(true);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 200,
    });

    // Virtual List Ref
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Virtuoso Components (Memoized to be stable references)
    // We cast keys to any to avoid generic constraints issues with Virtuoso types, but the structures match
    const virtuosoComponents = useMemo<Components<MessageItem, ChatContext>>(() => ({
        Header: ChatHeader,
        Footer: StreamingFooter as any
    }), []);

    // Initial scroll on load
    useEffect(() => {
        if (messages.length > 0 && !isStreaming) {
            // Small delay to ensure layout is ready
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end' });
            }, 100);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isStreaming) {
                onSendMessage(value.trim());
                setValue("");
                adjustHeight(true);
            }
        }
    };

    const handleSend = () => {
        if (value.trim() && !isStreaming) {
            onSendMessage(value.trim());
            setValue("");
            adjustHeight(true);
        }
    };

    const handleEnhance = async () => {
        if (!value.trim() || isEnhancing || !onEnhance) return;
        setIsEnhancing(true);
        try {
            const enhanced = await onEnhance(value);
            setValue(enhanced);
            adjustHeight();
        } catch (error) {
            console.error("Enhancement failed", error);
        } finally {
            setIsEnhancing(false);
            textareaRef.current?.focus();
        }
    };

    return (
        <div className="relative h-full w-full flex flex-col overflow-hidden bg-[#050507] text-white selection:bg-violet-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30" />
                <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] mix-blend-screen opacity-20" />
                <div className="bg-noise absolute inset-0 opacity-[0.03]" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 px-4 md:px-0 flex flex-col h-full">

                {/* Welcome State */}
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl pointer-events-auto">
                                <Sparkles className="w-8 h-8 text-white/80" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white/90 mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pointer-events-auto">
                                Nexus AI
                            </h1>
                            <p className="text-white/40 max-w-md text-sm md:text-base leading-relaxed pointer-events-auto">
                                {currentModel ? `Powered by ${currentModel}` : "Ready to build, design, and code."}
                            </p>

                            <div className="flex gap-3 mt-8 pointer-events-auto">
                                <button onClick={onOpenMemory} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white/60 transition-all">
                                    <Brain className="w-3.5 h-3.5" />
                                    <span>Memory {memoryCount > 0 && `(${memoryCount})`}</span>
                                </button>
                                <button onClick={onOpenSettings} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white/60 transition-all">
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Virtualized Message List */}
                {(messages.length > 0 || isStreaming) && (
                    <Virtuoso<MessageItem, ChatContext>
                        ref={virtuosoRef}
                        data={messages}
                        context={{ isStreaming, isSearching, streamingContent, searchMode }}
                        style={{ height: '100%' }}
                        className="scrollbar-hide"
                        followOutput={isAtBottom ? 'smooth' : false}
                        atBottomStateChange={setIsAtBottom}
                        initialTopMostItemIndex={messages.length - 1} // Start at bottom
                        atBottomThreshold={150}
                        itemContent={(index, msg) => (
                            <div className="px-4 md:px-0 max-w-3xl mx-auto py-2">
                                <ChatMessage
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    id={msg.id}
                                    webResult={msg.webResult}
                                    pdfUrl={msg.pdfUrl}
                                />
                            </div>
                        )}
                        components={virtuosoComponents}
                    />
                )}
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:pb-6 z-20 pointer-events-none flex justify-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                        "pointer-events-auto w-full max-w-3xl relative transition-all duration-300",
                        isFocused ? "scale-[1.01]" : "scale-100"
                    )}
                >
                    {/* Grounded Search Toggle */}
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={() => onSetSearchMode(searchMode === 'web' ? 'ai' : 'web')}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 backdrop-blur-xl shadow-xl",
                                searchMode === 'web'
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300",
                                searchMode === 'web' ? "bg-cyan-500 text-white rotate-0" : "bg-white/10 text-white/40 rotate-180"
                            )}>
                                <Globe className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-semibold tracking-wide">
                                {searchMode === 'web' ? 'GROUNDED SEARCH ACTIVE' : 'USE WEB CONTEXT'}
                            </span>
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                searchMode === 'web' ? "bg-cyan-500" : "bg-transparent"
                            )} />
                        </button>
                    </div>

                    <div className={cn(
                        "glass-input rounded-[26px] p-2 flex items-end gap-2 transition-all duration-300 relative overflow-hidden group",
                        isFocused ? (searchMode === 'web' ? "ring-2 ring-cyan-500/40 bg-[#0a0a0c]/80 shadow-[0_0_20px_rgba(6,182,212,0.1)]" : "ring-2 ring-violet-500/40 bg-[#0a0a0c]/80 shadow-[0_0_20px_rgba(139,92,246,0.1)]") : "bg-[#0a0a0c]/60"
                    )}>
                        {/* Glow Effect */}
                        <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                            searchMode === 'web' ? "bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10" : "bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10"
                        )} />

                        <div className="relative flex-1 min-h-[48px] flex items-center">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={placeholder}
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white text-[15px] placeholder:text-white/20 px-4 py-3 max-h-[200px] resize-none scrollbar-hide"
                                style={{ height: 52 }}
                            />
                        </div>

                        <div className="flex items-center gap-2 pb-1.5 pr-1.5">
                            {/* Enhance Prompt Button */}
                            {value.trim().length > 0 && onEnhance && (
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || isStreaming}
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isEnhancing
                                            ? "bg-violet-500/20 text-violet-400"
                                            : "text-white/40 hover:text-violet-400 hover:bg-violet-500/10"
                                    )}
                                    title="Enhance Prompt (AI)"
                                >
                                    {isEnhancing ? (
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={!value.trim() || isStreaming}
                                className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                                    value.trim() && !isStreaming
                                        ? "bg-white text-black hover:scale-105 hover:bg-white/90 shadow-white/10"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                )}
                            >
                                {isStreaming ? (
                                    <LoaderIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                    <SendIcon className="w-4 h-4 ml-0.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
