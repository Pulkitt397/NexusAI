import React, { useState, useEffect } from 'react';
import { AnimatedAIChat, AnimatedAIChatProps } from '@/components/ui/animated-ai-chat';
import { LivePreviewPane } from '@/components/LivePreviewPane';
import { CodeEditor } from '@/components/CodeEditor';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import { LayoutPanelLeft, SquareSplitHorizontal, AppWindow, X, FileCode, FolderOpen, FileText, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
    const [currentFiles, setCurrentFiles] = useState<WebDevFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState('');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    // Sync visual sidebar state with parent (App.tsx)
    useEffect(() => {
        if (props.onToggleSidebar) {
            props.onToggleSidebar(isSidebarVisible);
        }
    }, [isSidebarVisible, props.onToggleSidebar]);

    // Force sidebar hide on editor logic, IF that was the preference, but user wants manual toggle.
    // Let's default to visible, but allow toggle.
    // The previous logic was: "Hide sidebar in code mode". 
    // User requested: "The sidebar still visible make a small toggle to hide or show it on top and add index space in its space"
    // Meaning: They want to retain the ability to use the sidebar, but maybe replace it?
    // Let's just implement the manual toggle button and let the user decide.
    // We will initialize `isSidebarVisible` to `true` generally, or `false` if in code mode?
    // Let's stick to true by default and let user toggle it off.

    // Extract code from the latest message
    useEffect(() => {
        const lastMsg = props.messages[props.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            const extracted = extractPreviewableCode(lastMsg.content);

            // Handle new multi-file extraction
            if (extracted.files && extracted.files.length > 0) {
                const newFiles = extracted.files.map(f => ({
                    ...f,
                    path: f.name // simple path for now
                }));
                setCurrentFiles(newFiles);

                // Set default active file if not set or not in new list
                if (!activeFile || !newFiles.find(f => f.name === activeFile)) {
                    // Prefer index.html or App.tsx or first file
                    const main = newFiles.find(f => f.name === 'index.html' || f.name === 'App.tsx') || newFiles[0];
                    setActiveFile(main.name);
                }
            }

            // Always update preview doc (legacy + multifile merged)
            if (extracted.hasPreviewableContent) {
                const doc = buildPreviewDocument(extracted);
                setPreviewContent(doc);
            }
        } else if (props.messages.length === 0) {
            // Clear code if chat is reset
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

    return (
        <div className={cn(
            "flex flex-col font-sans bg-[#050507] text-white",
            // Use static positioning so it respects the sidebar flow, UNLESS in full-screen code mode where we want to take over?
            // Actually, if we want to "add index space in its space", we should just occupy the full width.
            // If viewMode is code, we set fixed inset-0 to cover everything, including the main sidebar.
            // BUT we provide a toggle to bring the main sidebar back (by unmounting fixed, or by shifting).
            // Let's respect the isSidebarVisible state. 
            // If isSidebarVisible is TRUE, the Main Sidebar is shown (app layout shifts).
            // This component is rendered inside <main>, so it sits to right of sidebar.
            // If we want to hide sidebar, we tell parent to hide it.

            // Let's use absolute inset-0. This makes it fill the <main> area.
            // If parent sidebar is hidden, <main> expands to full width.
            "absolute inset-0 z-50"
        )}>
            {/* Top Bar */}
            <header className="h-14 shrink-0 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    {/* Toggle Sidebar Button */}
                    <button
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                        title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        {isSidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>

                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5">
                        <code className="text-emerald-400 font-bold text-sm">{'</>'}</code>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-white/90">Nexus Studios</h1>
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
                        onClick={() => setViewMode('code')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === 'code' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <FileCode className="w-4 h-4" />
                        <span>Editor</span>
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

                {/* Pane 1: Chat */}
                <div className={cn(
                    "h-full transition-all duration-300 ease-in-out border-r border-white/10 overflow-hidden",
                    viewMode === 'chat' ? "w-full" :
                        viewMode === 'split' ? "w-1/2" : "w-0 border-none"
                )}>
                    <div className="w-full h-full min-w-[320px]">
                        <AnimatedAIChat {...props} />
                    </div>
                </div>

                {/* Pane 2: Editor (Enhanced with Sidebar) */}
                <div className={cn(
                    "h-full transition-all duration-300 ease-in-out border-r border-white/10 bg-[#1e1e1e] overflow-hidden flex",
                    viewMode === 'code' ? "w-full" : "w-0 border-none"
                )}>
                    {viewMode === 'code' && (
                        <>
                            {/* File Explorer Sidebar */}
                            <div className="w-64 bg-[#181818] border-r border-white/5 flex flex-col">
                                <div className="p-3 text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center justify-between">
                                    <span>Explorer</span>
                                    <button
                                        onClick={handleCreateFile}
                                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-emerald-400 transition-colors"
                                        title="New File"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {currentFiles.length === 0 ? (
                                        <div className="p-4 text-xs text-white/20 italic">
                                            No files generated yet.
                                        </div>
                                    ) : (
                                        <div className="px-2 space-y-0.5">
                                            {currentFiles.map(file => (
                                                <button
                                                    key={file.name}
                                                    onClick={() => setActiveFile(file.name)}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors group",
                                                        activeFile === file.name ? "bg-[#37373d] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2d2e]"
                                                    )}
                                                >
                                                    <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400 opacity-70 group-hover:opacity-100" />
                                                    <span className="truncate">{file.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="flex-1 h-full p-0 flex flex-col">
                                {activeFile ? (
                                    <CodeEditor
                                        code={activeFileContent}
                                        language={activeFileLang}
                                        onChange={handleCodeChange}
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                                        Select a file to edit
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Pane 3: Preview */}
                <div className={cn(
                    "h-full transition-all duration-300 ease-in-out bg-[#0f0f12] overflow-hidden",
                    viewMode === 'preview' ? "w-full" :
                        viewMode === 'split' ? "w-1/2" : "w-0"
                )}>
                    <LivePreviewPane
                        code={previewContent}
                        isStreaming={props.isStreaming}
                    />
                </div>
            </div>
        </div>
    );
}
