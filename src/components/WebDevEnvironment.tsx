import React, { useState, useEffect } from 'react';
import { AnimatedAIChat, AnimatedAIChatProps } from '@/components/ui/animated-ai-chat';
import { LivePreviewPane } from '@/components/LivePreviewPane';
import { CodeEditor } from '@/components/CodeEditor';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import { LayoutPanelLeft, SquareSplitHorizontal, AppWindow, X, FileCode, Play, Plus, Search, GitBranch, CheckCircle2, ChevronRight, FileJson, FileType2 } from 'lucide-react';

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

    // Auto-hide sidebar on mount
    useEffect(() => {
        if (props.onToggleSidebar) {
            props.onToggleSidebar(false);
        }
    }, []);

    // Extract code from messages
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

    // Resize Logic
    const startResizing = React.useCallback(() => setIsResizing(true), []);
    const stopResizing = React.useCallback(() => setIsResizing(false), []);
    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizing) {
            setChatWidth(prev => {
                const newWidth = e.clientX;
                return Math.max(300, Math.min(newWidth, window.innerWidth - 300));
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
        <div className="flex flex-col h-full bg-[#09090b] text-white overflow-hidden">

            {/* Local Toolbar - Compact */}
            <div className="h-10 shrink-0 border-b border-white/5 bg-[#09090b] flex items-center justify-between px-3 select-none">
                {/* Left: View Modes */}
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                    {[
                        { id: 'chat', icon: LayoutPanelLeft, label: 'Chat' },
                        { id: 'split', icon: SquareSplitHorizontal, label: 'Split' },
                        { id: 'code', icon: FileCode, label: 'Code' },
                        { id: 'preview', icon: AppWindow, label: 'Preview' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as ViewMode)}
                            className={cn(
                                "px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                viewMode === mode.id
                                    ? "bg-[#27272a] text-white shadow-sm ring-1 ring-black/20"
                                    : "text-white/40 hover:text-white/70"
                            )}
                            title={mode.label}
                        >
                            <mode.icon className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{mode.label}</span>
                        </button>
                    ))}
                </div>

                {/* Center: File Info (Placeholder) */}
                <div className="flex items-center gap-2 text-xs text-white/30 hidden md:flex">
                    {activeFile ? (
                        <>
                            <FileCode className="w-3.5 h-3.5 opacity-50" />
                            <span>{activeFile}</span>
                        </>
                    ) : (
                        <span>Ready to code</span>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20">
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">Run</span>
                    </button>
                </div>
            </div>

            {/* Main Split Area */}
            <div className="flex-1 overflow-hidden relative flex bg-[#0c0c0e]">

                {/* Chat Pane */}
                <div
                    className={cn(
                        "h-full overflow-hidden flex flex-col transition-all ease-[cubic-bezier(0.25,1,0.5,1)] bg-[#09090b]",
                        viewMode === 'split' ? "border-r border-white/5" : ""
                    )}
                    style={{
                        width: viewMode === 'chat' ? '100%' : viewMode === 'split' ? chatWidth : 0,
                        opacity: viewMode === 'code' || viewMode === 'preview' ? 0 : 1,
                        pointerEvents: viewMode === 'code' || viewMode === 'preview' ? 'none' : 'auto',
                        transitionDuration: isResizing ? '0ms' : '500ms'
                    }}
                >
                    <div className="flex-1 min-w-[320px]">
                        <AnimatedAIChat {...props} />
                    </div>
                </div>

                {/* Resizer */}
                {viewMode === 'split' && (
                    <div
                        className="w-1 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-50 flex flex-col justify-center items-center group -ml-0.5"
                        onMouseDown={startResizing}
                    >
                        <div className="w-0.5 h-8 bg-white/10 rounded-full group-hover:bg-white/40 group-active:bg-white/60 transition-colors" />
                    </div>
                )}

                {/* Editor & Preview Area */}
                <div className={cn(
                    "h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex-1 flex flex-col overflow-hidden",
                    (viewMode === 'chat') ? "w-0 flex-none" : "w-full"
                )}>
                    {/* If Split or Code -> Show Editor */}
                    {(viewMode === 'split' || viewMode === 'code') && (
                        <div className="flex-1 flex overflow-hidden">
                            {/* File Sidebar (Collapsible-ish) */}
                            <div className="w-48 bg-[#09090b] border-r border-white/5 flex flex-col shrink-0">
                                <div className="h-8 px-3 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Explorer</span>
                                    <button onClick={handleCreateFile} className="opacity-50 hover:opacity-100 hover:text-white transition-opacity">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto py-1">
                                    {currentFiles.map(file => (
                                        <button
                                            key={file.name}
                                            onClick={() => setActiveFile(file.name)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-3 py-1 text-[13px] text-left transition-colors border-l-2",
                                                activeFile === file.name
                                                    ? "bg-[#27272a] text-white border-indigo-500"
                                                    : "text-white/50 hover:text-white hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            {file.name.endsWith('html') ? <FileType2 className="w-3.5 h-3.5 text-orange-400" /> :
                                                file.name.endsWith('css') ? <FileType2 className="w-3.5 h-3.5 text-blue-400" /> :
                                                    <FileCode className="w-3.5 h-3.5 text-yellow-400" />}
                                            <span className="truncate">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Editor */}
                            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                                <div className="flex-1 relative">
                                    <CodeEditor code={activeFileContent} language={activeFileLang} onChange={handleCodeChange} />
                                </div>
                                {/* Status Bar */}
                                <div className="h-5 bg-[#007acc] flex items-center px-2 justify-between text-[10px] text-white select-none">
                                    <span>{activeFile}</span>
                                    <span>{activeFileLang.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* If Preview -> Show Preview */}
                    {viewMode === 'preview' && (
                        <div className="flex-1 bg-white">
                            <LivePreviewPane code={previewContent} isStreaming={props.isStreaming} />
                        </div>
                    )}

                    {/* Split Mode - Preview on bottom or right? No, standard split usually implies Chat | Editor. 
                        But we might want Chat | Preview. 
                        Current logic: Split = Chat | Editor.
                        Let's keep it simple. If you want Preview, click Preview mode. 
                    */}
                </div>
            </div>
        </div>
    );
}
