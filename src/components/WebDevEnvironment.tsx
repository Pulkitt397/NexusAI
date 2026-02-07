import React, { useState, useEffect } from 'react';
import { AnimatedAIChat, AnimatedAIChatProps } from '@/components/ui/animated-ai-chat';
import { LivePreviewPane } from '@/components/LivePreviewPane';
import { CodeEditor } from '@/components/CodeEditor';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import { LayoutPanelLeft, SquareSplitHorizontal, AppWindow, X, FileCode, ArrowLeft, Rocket, Layers, Play, Settings2, Plus, FileText, ChevronRight, Search, GitBranch, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'chat' | 'split' | 'code' | 'preview';

interface WebDevFile {
    name: string;
    language: string;
    content: string;
    path: string;
}

interface WebDevEnvironmentProps extends AnimatedAIChatProps {
    onClose: () => void;
    onToggleSidebar?: (isOpen: boolean) => void;
}

export function WebDevEnvironment(props: WebDevEnvironmentProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [chatWidth, setChatWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const [currentFiles, setCurrentFiles] = useState<WebDevFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState('');

    // Auto-hide sidebar on mount, restore on unmount
    useEffect(() => {
        if (props.onToggleSidebar) {
            props.onToggleSidebar(false); // Hide sidebar immediately
        }
        return () => {
            if (props.onToggleSidebar) {
                props.onToggleSidebar(true); // Restore on unmount
            }
        };
    }, []);

    // Extract code from the latest message
    useEffect(() => {
        const lastMsg = props.messages[props.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            const extracted = extractPreviewableCode(lastMsg.content);

            if (extracted.files && extracted.files.length > 0) {
                const newFiles = extracted.files.map(f => ({
                    ...f,
                    path: f.name
                }));
                setCurrentFiles(newFiles);

                if (!activeFile || !newFiles.find(f => f.name === activeFile)) {
                    const main = newFiles.find(f => f.name === 'index.html' || f.name === 'App.tsx') || newFiles[0];
                    setActiveFile(main.name);
                }
            }

            if (extracted.hasPreviewableContent) {
                const doc = buildPreviewDocument(extracted);
                setPreviewContent(doc);
            }
        } else if (props.messages.length === 0) {
            setCurrentFiles([]);
            setPreviewContent('');
            setActiveFile(null);
        }
    }, [props.messages]);

    const activeFileContent = currentFiles.find(f => f.name === activeFile)?.content || '';
    const activeFileLang = currentFiles.find(f => f.name === activeFile)?.language || 'text';

    const handleCodeChange = (newCode: string) => {
        if (!activeFile) return;
        const updatedFiles = currentFiles.map(f =>
            f.name === activeFile ? { ...f, content: newCode } : f
        );
        setCurrentFiles(updatedFiles);
        if (activeFile === 'index.html') {
            setPreviewContent(newCode);
        }
    };

    const handleCreateFile = () => {
        const name = prompt("Enter file name (e.g. styles.css):");
        if (name && !currentFiles.find(f => f.name === name)) {
            const ext = name.split('.').pop() || '';
            let lang = 'text';
            if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) lang = 'javascript';
            if (ext === 'html') lang = 'html';
            if (ext === 'css') lang = 'css';

            const newFile: WebDevFile = {
                name,
                language: lang,
                content: '',
                path: name
            };
            setCurrentFiles([...currentFiles, newFile]);
            setActiveFile(name);
        }
    };

    // Resize handlers
    const startResizing = React.useCallback(() => setIsResizing(true), []);
    const stopResizing = React.useCallback(() => setIsResizing(false), []);
    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizing) {
            setChatWidth(prev => {
                const newWidth = e.clientX;
                if (newWidth < 300) return 300; // Min width
                if (newWidth > window.innerWidth - 300) return window.innerWidth - 300; // Max width
                return newWidth;
            });
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#09090b] text-white flex flex-col font-sans">
            {/* 
               PREMIUM HEADER DESIGN 
               - Glassmorphism, blurred background
               - Minimal icons
               - "Lovable" aesthetic
            */}
            <header className="h-16 shrink-0 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={props.onClose}
                        className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                    </button>

                    <div className="h-6 w-px bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                            <Rocket className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                Nexus Studio
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-medium border border-indigo-500/20">BETA</span>
                            </h1>
                            <p className="text-[11px] text-white/40 font-medium">Full-Stack Environment</p>
                        </div>
                    </div>
                </div>

                {/* Center Control Group - View Modes */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="flex items-center p-1 bg-[#18181b]/80 border border-white/5 rounded-xl shadow-lg shadow-black/20 backdrop-blur-md">
                        <button onClick={() => setViewMode('chat')} className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2", viewMode === 'chat' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5")}>
                            <LayoutPanelLeft className="w-3.5 h-3.5" /> Chat
                        </button>
                        <button onClick={() => setViewMode('split')} className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2", viewMode === 'split' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5")}>
                            <SquareSplitHorizontal className="w-3.5 h-3.5" /> Split
                        </button>
                        <button onClick={() => setViewMode('code')} className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2", viewMode === 'code' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5")}>
                            <FileCode className="w-3.5 h-3.5" /> Code
                        </button>
                        <button onClick={() => setViewMode('preview')} className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2", viewMode === 'preview' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5")}>
                            <AppWindow className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors">
                        <Settings2 className="w-4 h-4" />
                    </button>
                    <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20">
                        <Play className="w-3 h-3 fill-current" />
                        Deploy
                    </button>
                </div>
            </header>

            {/* Main Content Area - Dark & Sleek */}
            <div className="flex-1 overflow-hidden relative flex bg-[#0c0c0e]">

                {/* Chat Pane */}
                {/* Chat Pane */}
                <div
                    className={cn(
                        "h-full overflow-hidden transition-all ease-[cubic-bezier(0.25,1,0.5,1)]",
                        viewMode === 'split' ? "border-r border-white/5" : ""
                    )}
                    style={{
                        width: viewMode === 'chat' ? '100%' : viewMode === 'split' ? chatWidth : 0,
                        transitionDuration: isResizing ? '0ms' : '500ms'
                    }}
                >
                    <div className="w-full h-full min-w-[320px]">
                        <AnimatedAIChat {...props} />
                    </div>
                </div>

                {/* Resizer Handle */}
                {viewMode === 'split' && (
                    <div
                        className="w-1 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-50 flex flex-col justify-center items-center group -ml-0.5"
                        onMouseDown={startResizing}
                    >
                        <div className="w-0.5 h-8 bg-white/20 rounded-full group-hover:bg-white/40 group-active:bg-white/60 transition-colors" />
                    </div>
                )}

                {/* Editor Pane (With Sidebar) */}
                <div className={cn(
                    "h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] border-r border-white/5 bg-[#09090b] overflow-hidden flex",
                    viewMode === 'code' ? "w-full" : "w-0 border-none"
                )}>
                    {viewMode === 'code' && (
                        <>
                            {/* File Explorer - VS Code Style */}
                            <div className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col">
                                <div className="h-9 px-4 flex items-center justify-between border-b border-white/5 bg-[#0c0c0e]">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <ChevronRight className="w-3 h-3" /> Project
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                                            <Search className="w-3 h-3" />
                                        </button>
                                        <button onClick={handleCreateFile} className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                                    {currentFiles.map(file => (
                                        <button
                                            key={file.name}
                                            onClick={() => setActiveFile(file.name)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-[13px] text-left transition-all border border-transparent group",
                                                activeFile === file.name
                                                    ? "bg-[#2a2d2e] text-white"
                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <FileCode className={cn("w-4 h-4 shrink-0",
                                                file.name.endsWith('html') ? "text-orange-400" :
                                                    file.name.endsWith('css') ? "text-blue-400" :
                                                        file.name.endsWith('js') || file.name.endsWith('ts') || file.name.endsWith('tsx') ? "text-yellow-400" :
                                                            "text-white/20"
                                            )} />
                                            <span className="truncate flex-1 font-medium">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 h-full flex flex-col bg-[#1e1e1e]">
                                {/* Tab Bar */}
                                <div className="h-9 flex items-center bg-[#09090b] border-b border-white/5 overflow-x-auto scrollbar-hide">
                                    {activeFile && (
                                        <div className="h-full flex items-center gap-2 px-3 bg-[#1e1e1e] border-t-2 border-indigo-500 min-w-[120px] max-w-[200px] group relative">
                                            <FileCode className={cn("w-3.5 h-3.5",
                                                activeFile.endsWith('html') ? "text-orange-400" :
                                                    activeFile.endsWith('css') ? "text-blue-400" :
                                                        "text-yellow-400"
                                            )} />
                                            <span className="text-[13px] text-white/90 truncate flex-1">{activeFile}</span>
                                            <X className="w-3.5 h-3.5 text-white/20 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <CodeEditor code={activeFileContent} language={activeFileLang} onChange={handleCodeChange} />
                                </div>
                                {/* VS Code Status Bar */}
                                <div className="h-6 bg-[#007acc] flex items-center px-3 justify-between text-[11px] text-white font-medium select-none">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 rounded cursor-pointer">
                                            <GitBranch className="w-3 h-3" />
                                            <span>main*</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 rounded cursor-pointer">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>0 errors</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="hover:bg-white/10 px-1 rounded cursor-pointer">Ln 12, Col 42</span>
                                        <span className="hover:bg-white/10 px-1 rounded cursor-pointer">UTF-8</span>
                                        <span className="hover:bg-white/10 px-1 rounded cursor-pointer">{activeFileLang.toUpperCase()}</span>
                                        <span className="hover:bg-white/10 px-1 rounded cursor-pointer">Prettier</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Preview Pane */}
                <div className={cn(
                    "h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] bg-[#0c0c0e] overflow-hidden",
                    viewMode === 'preview' ? "w-full" : viewMode === 'split' ? "flex-1" : "w-0"
                )}>
                    <LivePreviewPane code={previewContent} isStreaming={props.isStreaming} />
                </div>
            </div>
        </div>
    );
}
