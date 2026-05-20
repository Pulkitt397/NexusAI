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
import { PipelineStageCard } from "./PipelineStageCard";

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
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-medium tracking-wide bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 mt-1">
                    AI
                </div>
                <div className="max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-4 text-sm md:text-[15px] leading-relaxed bg-[#27272a]/60 border border-white/5 text-white/90 min-h-[60px]">
                    {streamingContent ? (
                        <MessageContent content={streamingContent} isStreaming={true} />
                    ) : (
                        <div className="flex items-center gap-2 text-white/40 h-full py-1">
                            <LoaderIcon className={cn("w-4 h-4 animate-spin", context?.isSearching ? "text-cyan-400" : "text-indigo-400")} />
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
    onPipelineStart?: (prompt: string) => Promise<void>;
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
    placeholder = "Message Nexus...",
    onEnhance,
    searchMode,
    onSetSearchMode,
    isSearching,
    availableModels,
    currentModelId,
    onSelectModel,
    providers,
    currentProviderId,
    onSelectProvider,
    onPipelineStart
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
        <div className="flex flex-col h-full w-full bg-[#030303] text-white selection:bg-indigo-500/35 overflow-hidden relative">
            {/* Modern Premium Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[#030303]" />
                {/* Glowing mesh blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/[0.08] rounded-full blur-[140px] animate-[mesh-drift_15s_infinite_ease-in-out]" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[55vw] h-[55vw] bg-purple-600/[0.06] rounded-full blur-[120px] animate-[mesh-drift_18s_infinite_ease-in-out_2s]" />
                <div className="absolute top-[30%] left-[25%] w-[45vw] h-[45vw] bg-blue-500/[0.03] rounded-full blur-[130px] animate-[mesh-drift_20s_infinite_ease-in-out_4s]" />
                {/* High tech grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_50%,transparent_100%)]" />
            </div>

            {/* 1. Scrollable Content Area (Flex Grow) */}
            <div className="flex-1 min-h-0 relative z-10">
                {/* Welcome State */}
                <AnimatePresence>
                    {messages.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="pointer-events-auto max-w-lg w-full px-6"
                            >
                                <div className="relative w-28 h-28 mx-auto mb-10 group">
                                    {/* Double halo glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.2rem] rotate-6 opacity-40 blur-md group-hover:rotate-12 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-[2.2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.3)] border border-white/10 relative z-10">
                                        <svg viewBox="0 0 96 96" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <linearGradient id="nexusWelcomeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#c7d2fe" />
                                                    <stop offset="50%" stopColor="#ddd6fe" />
                                                    <stop offset="100%" stopColor="#e9d5ff" />
                                                </linearGradient>
                                                <linearGradient id="nexusWelcomeGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#a5b4fc" />
                                                    <stop offset="100%" stopColor="#c4b5fd" />
                                                </linearGradient>
                                                <filter id="welcomeGlow">
                                                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                                </filter>
                                            </defs>
                                            <path d="M28 68V28L48 52L68 28V68" stroke="url(#nexusWelcomeGrad1)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#welcomeGlow)" />
                                            <circle cx="28" cy="68" r="3" fill="#c7d2fe" />
                                            <circle cx="68" cy="68" r="3" fill="#e9d5ff" />
                                            <circle cx="48" cy="52" r="2.5" fill="#ddd6fe" />
                                            <circle cx="28" cy="28" r="3" fill="#a5b4fc" />
                                            <circle cx="68" cy="28" r="3" fill="#c4b5fd" />
                                            <line x1="28" y1="68" x2="48" y2="52" stroke="url(#nexusWelcomeGrad2)" strokeWidth="1.5" opacity="0.5" />
                                            <line x1="68" y1="68" x2="48" y2="52" stroke="url(#nexusWelcomeGrad2)" strokeWidth="1.5" opacity="0.5" />
                                            <line x1="28" y1="28" x2="48" y2="52" stroke="url(#nexusWelcomeGrad2)" strokeWidth="1.5" opacity="0.5" />
                                            <line x1="68" y1="28" x2="48" y2="52" stroke="url(#nexusWelcomeGrad2)" strokeWidth="1.5" opacity="0.5" />
                                        </svg>
                                    </div>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight font-sans">
                                    Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Nexus</span>
                                </h1>
                                <p className="text-white/50 text-sm md:text-base mb-10 leading-relaxed max-w-sm mx-auto font-medium">
                                    Your intelligent AI studio & chat companion. Harness cutting edge reasoning and models.
                                </p>

                                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                                    <motion.button 
                                        onClick={onOpenMemory} 
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
                                    >
                                        <Brain className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                                        <span>Memory Space</span>
                                    </motion.button>
                                    <motion.button 
                                        onClick={onOpenSettings}
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
                                    >
                                        <Settings className="w-4 h-4 text-violet-400 group-hover:text-violet-300" />
                                        <span>Settings</span>
                                    </motion.button>
                                </div>

                                {/* Feature highlights */}
                                <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto border-t border-white/5 pt-8">
                                    <div className="text-center group cursor-default">
                                        <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Search</p>
                                    </div>
                                    <div className="text-center group cursor-default">
                                        <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/10 group-hover:bg-violet-500/20 transition-all">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Enhance</p>
                                    </div>
                                    <div className="text-center group cursor-default">
                                        <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                                            <Brain className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Context</p>
                                    </div>
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
                                {/* Special handling for 'system' role messages that carry pipeline data */}
                                {msg.role === 'system' && msg.content.startsWith('{') ? (
                                    <PipelineStageCard content={msg.content} />
                                ) : (
                                    <ChatMessage
                                        key={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        id={msg.id}
                                        webResult={msg.webResult}
                                        pdfUrl={msg.pdfUrl}
                                    />
                                )}
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
                            className="absolute bottom-4 right-4 z-30 p-3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white shadow-xl shadow-indigo-500/20 backdrop-blur-md hover:scale-110 hover:shadow-indigo-500/40 transition-all border border-white/10 cursor-pointer"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Super Input Bar (Sticky Bottom) */}
            <div className="shrink-0 z-20 bg-[#030305]/85 backdrop-blur-2xl border-t border-white/[0.05] pb-[env(safe-area-inset-bottom)]">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className={cn(
                        "relative flex items-end gap-3 p-3.5 rounded-2xl transition-all duration-300 border",
                        isFocused 
                            ? "bg-[#070709]/90 border-indigo-500/40 shadow-[0_0_35px_-5px_rgba(99,102,241,0.25)]" 
                            : "bg-[#09090b]/40 border-white/[0.05] hover:border-white/10"
                    )}>

                        {/* Left: Provider & Model Selector & Search Toggle */}
                        <div className="flex items-center gap-1.5 pb-1">
                            {/* Provider Selector Trigger */}
                            <div className="relative">
                                <motion.button
                                    onClick={() => {
                                        setShowProviderSelector(!showProviderSelector);
                                        setShowModelSelector(false);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-white/50 hover:text-white transition-all cursor-pointer h-8 border border-white/[0.03]"
                                    title="Select Provider"
                                >
                                    <span className="max-w-[80px] truncate flex items-center justify-center">
                                        {(() => {
                                            const p = providers.find(p => p.id === currentProviderId);
                                            return p ? <img src={p.icon} alt={p.name} className="w-4 h-4 object-contain" /> : "🔌";
                                        })()}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                                </motion.button>
                                {/* Provider Dropdown */}
                                <AnimatePresence>
                                    {showProviderSelector && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProviderSelector(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute bottom-full left-0 mb-2.5 w-52 bg-[#070709]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5"
                                            >
                                                {providers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            onSelectProvider(p.id);
                                                            setShowProviderSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-white/5 flex items-center gap-2.5 cursor-pointer",
                                                            currentProviderId === p.id ? "text-indigo-400 bg-indigo-500/10" : "text-white/60"
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
                                <motion.button
                                    onClick={() => {
                                        setShowModelSelector(!showModelSelector);
                                        setShowProviderSelector(false);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-white/50 hover:text-white transition-all cursor-pointer h-8 border border-white/[0.03]"
                                    title="Select Model"
                                >
                                    <span className="max-w-[90px] truncate text-white">
                                        {availableModels.find(m => m.id === currentModelId)?.name || "Model"}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                                </motion.button>
                                {/* Model Dropdown */}
                                <AnimatePresence>
                                    {showModelSelector && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowModelSelector(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute bottom-full left-0 mb-2.5 w-72 max-h-72 bg-[#070709]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-y-auto py-1.5 custom-scrollbar"
                                            >
                                                {availableModels.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            onSelectModel(model.id);
                                                            setShowModelSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-white/5 cursor-pointer",
                                                            currentModelId === model.id ? "text-indigo-400 bg-indigo-500/10" : "text-white/60"
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
                            <motion.button
                                onClick={() => onSetSearchMode(searchMode === 'web' ? 'ai' : 'web')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "p-2 rounded-xl transition-all duration-200 cursor-pointer h-8 w-8 flex items-center justify-center border",
                                    searchMode === 'web' 
                                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] animate-pulse" 
                                        : "bg-white/[0.03] text-slate-400 border-white/[0.03] hover:text-cyan-300 hover:bg-white/10 hover:border-cyan-500/10"
                                )}
                                title={searchMode === 'web' ? "Web Search Active" : "Enable Web Search"}
                            >
                                <Globe className="w-4 h-4" />
                            </motion.button>

                            {/* Construction / Build Mode Toggle (New) */}
                            {onPipelineStart && (
                                <motion.button
                                    onClick={() => {
                                        alert("To use Builder: Type your request and click Send. The system will auto-detect 'Build' intent or we can force it here. (Feature coming)");
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-xl transition-all cursor-pointer h-8 w-8 flex items-center justify-center bg-white/[0.03] text-slate-400 border border-white/[0.03] hover:text-indigo-400 hover:bg-white/10 hover:border-indigo-500/10"
                                    title="Builder Mode"
                                >
                                    <div className="w-4 h-4">🔨</div>
                                </motion.button>
                            )}
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
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white text-[15px] placeholder:text-white/20 resize-none scrollbar-hide leading-relaxed font-medium"
                                style={{ height: 24, maxHeight: 120 }}
                                rows={1}
                            />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 pb-1">
                            {/* Enhanced */}
                            {value.trim().length > 0 && onEnhance && (
                                <motion.button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || isStreaming}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-xl text-white/40 hover:text-indigo-300 hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                                >
                                    <Sparkles className={cn("w-4 h-4", isEnhancing && "animate-pulse text-indigo-400")} />
                                </motion.button>
                            )}

                            {/* Mic */}
                            {!value.trim() && (
                                <motion.button
                                    onClick={handleMicClick}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                                >
                                    <Mic className="w-4 h-4" />
                                </motion.button>
                            )}

                            {/* Send */}
                            <motion.button
                                onClick={handleSend}
                                disabled={!value.trim() || isStreaming}
                                whileHover={value.trim() && !isStreaming ? { scale: 1.05 } : {}}
                                whileTap={value.trim() && !isStreaming ? { scale: 0.95 } : {}}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                                    value.trim() && !isStreaming
                                        ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 border-0"
                                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/[0.02]"
                                )}
                            >
                                {isStreaming ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                            </motion.button>
                        </div>
                    </div>
                    {/* Helper Text / Mode Indicator */}
                    <div className="text-[10px] text-center text-white/30 mt-2 font-bold tracking-wider uppercase">
                        {searchMode === 'web' ? <span className="flex items-center justify-center gap-1.5"><Globe className="w-3.5 h-3.5 text-cyan-400" /> Searching the web for answers</span> : <span className="flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI mode active</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
