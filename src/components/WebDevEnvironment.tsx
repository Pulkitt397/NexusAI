import React, { useState, useEffect } from 'react';
import { AnimatedAIChat, AnimatedAIChatProps } from '@/components/ui/animated-ai-chat';
import { LivePreviewPane } from '@/components/LivePreviewPane';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import { LayoutPanelLeft, SquareSplitHorizontal, AppWindow, X } from 'lucide-react';

type ViewMode = 'chat' | 'split' | 'preview';

interface WebDevEnvironmentProps extends AnimatedAIChatProps {
    onClose: () => void;
}

export function WebDevEnvironment(props: WebDevEnvironmentProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [currentCode, setCurrentCode] = useState('');

    // Extract code from the latest message
    useEffect(() => {
        const lastMsg = props.messages[props.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            const extracted = extractPreviewableCode(lastMsg.content);
            if (extracted.hasPreviewableContent) {
                const doc = buildPreviewDocument(extracted);
                setCurrentCode(doc);
            }
        } else if (props.messages.length === 0) {
            // Clear code if chat is reset
            setCurrentCode('');
        }
    }, [props.messages]);

    return (
        <div className="absolute inset-0 z-50 bg-[#050507] text-white flex flex-col font-sans">
            {/* Top Bar */}
            <header className="h-14 shrink-0 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5">
                        <code className="text-emerald-400 font-bold text-sm">{'</>'}</code>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-white/90">Nexus WebDev</h1>
                        <p className="text-[10px] text-white/40 font-mono">Environment Active</p>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex bg-black/20 rounded-lg p-1 border border-white/5 gap-1">
                    <button
                        onClick={() => setViewMode('chat')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === 'chat' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <LayoutPanelLeft className="w-4 h-4" />
                        <span>Chat</span>
                    </button>
                    <button
                        onClick={() => setViewMode('split')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === 'split' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <SquareSplitHorizontal className="w-4 h-4" />
                        <span>Split</span>
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === 'preview' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <AppWindow className="w-4 h-4" />
                        <span>Preview</span>
                    </button>
                </div>

                {/* Close / Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={props.onClose}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 text-white/40 rounded-lg transition-colors"
                        title="Exit WebDev Mode"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex">
                {/* Chat Pane */}
                <div className={cn(
                    "h-full transition-all duration-300 ease-in-out border-r border-white/10",
                    viewMode === 'chat' ? "w-full" :
                        viewMode === 'split' ? "w-1/2" : "w-0 overflow-hidden border-none"
                )}>
                    <div className="w-full h-full">
                        <AnimatedAIChat {...props} />
                    </div>
                </div>

                {/* Preview Pane */}
                <div className={cn(
                    "h-full transition-all duration-300 ease-in-out bg-[#0f0f12]",
                    viewMode === 'preview' ? "w-full" :
                        viewMode === 'split' ? "w-1/2" : "w-0 overflow-hidden"
                )}>
                    <LivePreviewPane
                        code={currentCode}
                        isStreaming={props.isStreaming}
                    />
                </div>
            </div>
        </div>
    );
}
