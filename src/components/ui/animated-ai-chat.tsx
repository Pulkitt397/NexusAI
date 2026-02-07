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
    Globe,
    Mic,
    ChevronDown,
    Search,
    ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { MessageContent } from "./MessageContent";
import { ChatMessage } from "./ChatMessage";
import { Virtuoso, type VirtuosoHandle, type Components } from 'react-virtuoso';

import { WebSearchResult, SearchMode, Model, Provider } from "@/types";

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

    if (!isStreaming) return <div className="pb-4" />; // Small padding

    return (
        <div className="px-4 md:px-0 max-w-3xl mx-auto pb-4">
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
const ChatHeader = () => <div className="h-4" />;

// --- MAIN COMPONENT ---

export interface AnimatedAIChatProps {
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
    // New Props for Super Bar
    availableModels: Model[];
    currentModelId: string | null;
    onSelectModel: (modelId: string) => void;
    providers: Provider[];
    currentProviderId: string | null;
    onSelectProvider: (providerId: string) => Promise<void>;
}

export function AnimatedAIChat({
    onSendMessage,
    isStreaming,
    streamingContent,
    messages,
    onOpenMemory,
    onOpenSettings,
    memoryCount,
    currentModel, // Display name
    placeholder = "Message NexusAI...",
    onEnhance,
    searchMode,
    onSetSearchMode,
    isSearching,
    availableModels,
    currentModelId,
    onSelectModel,
    providers,
    currentProviderId,
    onSelectProvider
}: AnimatedAIChatProps) {
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showProviderSelector, setShowProviderSelector] = useState(false);

    // Auto-scroll state
    const [isAtBottom, setIsAtBottom] = useState(true);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 24, // Compact start
        maxHeight: 120,
    });

    // Virtual List Ref
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Virtuoso Components (Memoized to be stable references)
    const virtuosoComponents = useMemo<Components<MessageItem, ChatContext>>(() => ({
        Header: ChatHeader,
        Footer: StreamingFooter as any
    }), []);

    // Initial scroll on load
    useEffect(() => {
        if (messages.length > 0 && !isStreaming) {
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

    const handleMicClick = () => {
        // Basic check for browser support
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser.");
            return;
        }
        // @ts-ignore
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            // Visual cue could be added here
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setValue(prev => (prev ? prev + ' ' : '') + transcript);
            adjustHeight();
        };

        recognition.start();
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent text-white selection:bg-violet-500/30 overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [-50, 50, -50],
                        y: [-50, 50, -50],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        x: [50, -50, 50],
                        y: [50, -50, 50],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30"
                />
            </div>

            {/* 1. Scrollable Content Area (Flex Grow) */}
            <div className="flex-1 min-h-0 relative z-10">
                {/* Welcome State */}
                <AnimatePresence>
                    {messages.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pointer-events-auto"
                            >
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0px rgba(139, 92, 246, 0)", "0 0 40px rgba(139, 92, 246, 0.2)", "0 0 0px rgba(139, 92, 246, 0)"],
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-xl mx-auto relative group"
                                >
                                    <Sparkles className="w-12 h-12 text-white/80 group-hover:text-white transition-colors" />
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
                                </motion.div>
                                <h1 className="text-5xl font-bold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                                    Nexus AI
                                </h1>
                                <p className="text-white/50 max-w-md mx-auto text-lg leading-relaxed mb-10 font-medium">
                                    Ready to build, design, and code with advanced AI models.
                                </p>

                                <div className="flex gap-4 justify-center">
                                    <button onClick={onOpenMemory} className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold text-white/70 transition-all hover:scale-105 active:scale-95 shadow-lg">
                                        <Brain className="w-4 h-4 text-violet-400" />
                                        <span>Memory {memoryCount > 0 && `(${memoryCount})`}</span>
                                    </button>
                                    <button onClick={onOpenSettings} className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold text-white/70 transition-all hover:scale-105 active:scale-95 shadow-lg">
                                        <Settings className="w-4 h-4 text-violet-400" />
                                        <span>Configure</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
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
                        followOutput={isAtBottom ? 'auto' : false}
                        atBottomStateChange={(bottom) => {
                            if (bottom !== isAtBottom) setIsAtBottom(bottom);
                        }}
                        initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
                        atBottomThreshold={100}
                        increaseViewportBy={{ top: 200, bottom: 200 }}
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

                {/* Scroll to Bottom Button */}
                <AnimatePresence>
                    {!isAtBottom && messages.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            onClick={() => {
                                virtuosoRef.current?.scrollToIndex({
                                    index: messages.length - 1,
                                    align: 'end',
                                    behavior: 'smooth'
                                });
                                setIsAtBottom(true);
                            }}
                            className="absolute bottom-4 right-4 z-30 p-2.5 rounded-full bg-violet-600/90 text-white shadow-xl shadow-violet-500/20 backdrop-blur-md hover:bg-violet-700 transition-colors border border-white/10"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Super Input Bar (Sticky Bottom) */}
            <div className="shrink-0 z-20 bg-[#050507]/40 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
                <div className="max-w-3xl mx-auto px-2 py-2">
                    <div className={cn(
                        "relative flex items-end gap-2 p-2 rounded-[24px] transition-all duration-300",
                        isFocused ? "bg-white/10 ring-1 ring-white/10" : "bg-white/5"
                    )}>

                        {/* Left: Provider & Model Selector & Search Toggle */}
                        <div className="flex items-center gap-1 pb-1">
                            {/* Provider Selector Trigger */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowProviderSelector(!showProviderSelector);
                                        setShowModelSelector(false);
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-white/10 text-xs font-medium text-white/70 transition-colors"
                                    title="Select Provider"
                                >
                                    <span className="max-w-[80px] truncate flex items-center justify-center">
                                        {(() => {
                                            const p = providers.find(p => p.id === currentProviderId);
                                            return p ? <img src={p.icon} alt={p.name} className="w-4 h-4 object-contain" /> : "🔌";
                                        })()}
                                    </span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                {/* Provider Dropdown */}
                                <AnimatePresence>
                                    {showProviderSelector && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProviderSelector(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                // Updated height to accommodate images
                                                className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                                            >
                                                {providers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            onSelectProvider(p.id);
                                                            setShowProviderSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5 flex items-center gap-2",
                                                            currentProviderId === p.id ? "text-violet-400 bg-violet-500/10" : "text-white/70"
                                                        )}
                                                    >
                                                        <img src={p.icon} alt={p.name} className="w-4 h-4 object-contain" />
                                                        {p.name}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Model Selector Trigger */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowModelSelector(!showModelSelector);
                                        setShowProviderSelector(false);
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-white/10 text-xs font-medium text-white/70 transition-colors"
                                    title="Select Model"
                                >
                                    <span className="max-w-[80px] truncate">
                                        {availableModels.find(m => m.id === currentModelId)?.name || "Model"}
                                    </span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                {/* Model Dropdown */}
                                <AnimatePresence>
                                    {showModelSelector && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowModelSelector(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute bottom-full left-0 mb-2 w-64 max-h-64 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-y-auto py-1 scrollbar-hide"
                                            >
                                                {availableModels.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            onSelectModel(model.id);
                                                            setShowModelSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5",
                                                            currentModelId === model.id ? "text-violet-400 bg-violet-500/10" : "text-white/70"
                                                        )}
                                                    >
                                                        {model.name}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Web Search Toggle */}
                            <button
                                onClick={() => onSetSearchMode(searchMode === 'web' ? 'ai' : 'web')}
                                className={cn(
                                    "p-2 rounded-full transition-colors",
                                    searchMode === 'web' ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                )}
                                title={searchMode === 'web' ? "Web Search Active" : "Enable Web Search"}
                            >
                                <Globe className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Center: Auto-resizing Input */}
                        <div className="flex-1 min-w-0 py-1.5">
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
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white text-[15px] placeholder:text-white/30 resize-none scrollbar-hide leading-relaxed"
                                style={{ height: 24, maxHeight: 120 }}
                                rows={1}
                            />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 pb-1">
                            {/* Enhance */}
                            {value.trim().length > 0 && onEnhance && (
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || isStreaming}
                                    className="p-2 rounded-full text-white/40 hover:text-violet-400 hover:bg-white/5 transition-colors"
                                >
                                    <Sparkles className={cn("w-4 h-4", isEnhancing && "animate-pulse text-violet-400")} />
                                </button>
                            )}

                            {/* Mic */}
                            {!value.trim() && (
                                <button
                                    onClick={handleMicClick}
                                    className="p-2 rounded-full text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            )}

                            {/* Send */}
                            <button
                                onClick={handleSend}
                                disabled={!value.trim() || isStreaming}
                                className={cn(
                                    "p-2 rounded-full transition-all duration-200",
                                    value.trim() && !isStreaming
                                        ? "bg-violet-600 text-white shadow-lg hover:bg-violet-700 hover:scale-105"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                )}
                            >
                                {isStreaming ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {/* Helper Text / Mode Indicator */}
                    <div className="text-[10px] text-center text-white/20 mt-1.5 font-medium tracking-wide">
                        {searchMode === 'web' ? 'Searching the web for answers' : 'AI mode active'}
                    </div>
                </div>
            </div>
        </div>
    );
}
