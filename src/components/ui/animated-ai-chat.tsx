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
        <div className="flex flex-col h-full w-full bg-[#09090b] text-white selection:bg-indigo-500/30 overflow-hidden">
            {/* Modern Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#09090b] via-[#18181b] to-[#09090b]" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[0.08] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/[0.06] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[150px]" />
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
            </div>

            {/* 1. Scrollable Content Area (Flex Grow) */}
            <div className="flex-1 min-h-0 relative z-10">
                {/* Welcome State */}
                <AnimatePresence>
                    {messages.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="pointer-events-auto max-w-md w-full"
                            >
                                <div className="relative w-28 h-28 mx-auto mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] rotate-6 opacity-60 blur-sm animate-pulse" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 to-violet-600/90 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 border border-white/10">
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

                                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                                    Welcome to <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Nexus</span>
                                </h1>
                                <p className="text-white/50 text-base mb-10 leading-relaxed max-w-sm mx-auto">
                                    Your intelligent AI workspace. Select a model or start typing to begin.
                                </p>

                                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                                    <button onClick={onOpenMemory} className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-white/80 hover:text-white hover:border-white/20 group">
                                        <Brain className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                                        <span>Memory</span>
                                    </button>
                                    <button onClick={onOpenSettings} className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-white/80 hover:text-white hover:border-white/20 group">
                                        <Settings className="w-4 h-4 text-violet-400 group-hover:text-violet-300" />
                                        <span>Settings</span>
                                    </button>
                                </div>

                                {/* Feature highlights */}
                                <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                                    <div className="text-center">
                                        <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-white/40">Web Search</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-white/40">Enhance</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Brain className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-white/40">Memory</p>
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
                            className="absolute bottom-4 right-4 z-30 p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/20 backdrop-blur-md hover:scale-110 hover:shadow-indigo-500/40 transition-all border border-white/10"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Super Input Bar (Sticky Bottom) */}
            <div className="shrink-0 z-20 bg-[#09090b]/80 backdrop-blur-2xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className={cn(
                        "relative flex items-end gap-3 p-3 rounded-2xl transition-all duration-300 border",
                        isFocused 
                            ? "bg-[#27272a]/60 border-indigo-500/30 shadow-lg shadow-indigo-500/10" 
                            : "bg-[#18181b]/60 border-white/5 hover:border-white/10"
                    )}>

                        {/* Left: Provider & Model Selector & Search Toggle */}
                        <div className="flex items-center gap-2 pb-1">
                            {/* Provider Selector Trigger */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowProviderSelector(!showProviderSelector);
                                        setShowModelSelector(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs font-medium text-white/40 hover:text-white transition-colors"
                                    title="Select Provider"
                                >
                                    <span className="max-w-[80px] truncate flex items-center justify-center">
                                        {(() => {
                                            const p = providers.find(p => p.id === currentProviderId);
                                            return p ? <img src={p.icon} alt={p.name} className="w-4 h-4 object-contain" /> : "🔌";
                                        })()}
                                    </span>
                                    <ChevronDown className="w-3 h-3" />
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
                                                className="absolute bottom-full left-0 mb-2 w-52 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden py-1"
                                            >
                                                {providers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            onSelectProvider(p.id);
                                                            setShowProviderSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/5 flex items-center gap-2",
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
                                <button
                                    onClick={() => {
                                        setShowModelSelector(!showModelSelector);
                                        setShowProviderSelector(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs font-medium text-white/40 hover:text-white transition-colors"
                                    title="Select Model"
                                >
                                    <span className="max-w-[80px] truncate">
                                        {availableModels.find(m => m.id === currentModelId)?.name || "Model"}
                                    </span>
                                    <ChevronDown className="w-3 h-3" />
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
                                                className="absolute bottom-full left-0 mb-2 w-72 max-h-72 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-y-auto py-1"
                                            >
                                                {availableModels.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            onSelectModel(model.id);
                                                            setShowModelSelector(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/5",
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
                            <button
                                onClick={() => onSetSearchMode(searchMode === 'web' ? 'ai' : 'web')}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    searchMode === 'web' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
                                )}
                                title={searchMode === 'web' ? "Web Search Active" : "Enable Web Search"}
                            >
                                <Globe className="w-4 h-4" />
                            </button>

                            {/* Construction / Build Mode Toggle (New) */}
                            {onPipelineStart && (
                                <button
                                    onClick={() => {
                                        // Toggle logic or just direct action if it's a specific mode
                                        // For now, let's just use it as a trigger indicator or have a separate state
                                        // Actually, let's keep it simple. If text starts with "Build", we trigger pipeline?
                                        // No, explicit button is better.
                                        // Let's add a "Build" button that replaces Send if in Build Mode.
                                        alert("To use Builder: Type your request and click Send. The system will auto-detect 'Build' intent or we can force it here. (Feature coming)");
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors", // Hidden for now until fully wired
                                        "text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50"
                                    )}
                                    title="Builder Mode"
                                >
                                    <div className="w-4 h-4">🔨</div>
                                </button>
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
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white text-[15px] placeholder:text-white/30 resize-none scrollbar-hide leading-relaxed"
                                style={{ height: 24, maxHeight: 120 }}
                                rows={1}
                            />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 pb-1">
                            {/* Enhanced */}
                            {value.trim().length > 0 && onEnhance && (
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || isStreaming}
                                    className="p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-white/5 transition-colors"
                                >
                                    <Sparkles className={cn("w-4 h-4", isEnhancing && "animate-pulse text-indigo-400")} />
                                </button>
                            )}

                            {/* Mic */}
                            {!value.trim() && (
                                <button
                                    onClick={handleMicClick}
                                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            )}

                            {/* Send */}
                            <button
                                onClick={handleSend}
                                disabled={!value.trim() || isStreaming}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-200",
                                    value.trim() && !isStreaming
                                        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 hover:shadow-indigo-500/30"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                )}
                            >
                                {isStreaming ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {/* Helper Text / Mode Indicator */}
                    <div className="text-[10px] text-center text-white/30 mt-2 font-medium tracking-wide">
                        {searchMode === 'web' ? <span className="flex items-center justify-center gap-1.5"><Globe className="w-3 h-3" /> Searching the web for answers</span> : <span className="flex items-center justify-center gap-1.5"><Sparkles className="w-3 h-3" /> AI mode active</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
