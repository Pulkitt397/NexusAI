import React, { useState, useEffect, useCallback } from 'react';
import { runPlanningPhase, runBuildPhase, PipelineEvent } from '@/ai/pipeline';
import { useApp } from '@/context';
import { AnimatedAIChat, AnimatedAIChatProps } from '@/components/ui/animated-ai-chat';
import { LivePreviewPane } from '@/components/LivePreviewPane';
import { CodeEditor } from '@/components/CodeEditor';
import { PlanView } from '@/components/PlanView';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import {
    LayoutPanelLeft,
    SquareSplitHorizontal,
    AppWindow,
    X,
    FileCode,
    Play,
    Plus,
    Save,
    History,
    LayoutTemplate
} from 'lucide-react';
import { StageIndicator } from './layout/StageIndicator';
import { ArchitectureSidebar } from './layout/ArchitectureSidebar';
import { StageActionPanel } from './layout/StageActionPanel';
import { WorkspaceBackground } from './layout/WorkspaceBackground';

type ViewMode = 'chat' | 'split' | 'code' | 'preview' | 'plan';

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
    const {
        state,
        addSystemMessage,
        updateChatCode,
        showToast,
        setProjectStage,
        updateSections,
        selectSection,
        setBuilderState,
        sendMessage
    } = useApp();

    const [viewMode, setViewMode] = useState<ViewMode>(
        state.projectStage === 'intent' || state.projectStage === 'architecture' ? 'plan' : 'split'
    );
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const [currentFiles, setCurrentFiles] = useState<WebDevFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState('');
    // Unified command handler
    const handleCommand = async (content: string) => {
        if (state.projectStage === 'intent') {
            await handlePipelineStart(content);
        } else {
            await sendMessage(content);
        }
    };

    const handlePipelineStart = async (userPrompt: string) => {
        if (!state.currentProviderId || !state.currentModelId) {
            showToast("Please select a provider and model first.", "error");
            return;
        }

        const apiKey = state.apiKeys[state.currentProviderId];
        if (!apiKey) {
            showToast("No API Key found.", "error");
            return;
        }

        showToast("Thinking...", "info");
        setProjectStage('architecture');
        setViewMode('plan');

        await runPlanningPhase(userPrompt, state.currentProviderId, apiKey, state.currentModelId, (event: PipelineEvent) => {
            // Transform pipeline events to global state updates
            if (event.type === 'STEP_STARTED') {
                console.log("[Pipeline]", event.payload);
            }

            if (event.type === 'INTENT_GENERATED') {
                setBuilderState({ siteIntent: event.payload });
            }

            if (event.type === 'ARCHITECTURE_GENERATED') {
                setBuilderState({ siteArchitecture: event.payload });
                const sections = event.payload.sections.map((s, idx) => ({
                    id: s.id,
                    title: s.name,
                    description: s.purpose,
                    status: 'pending' as const,
                    order: idx
                }));
                updateSections(sections);
            }

            if (event.type === 'DESIGN_GENERATED') {
                setBuilderState({ designSystem: event.payload });
            }

            if (event.type === 'ASSET_GENERATED') {
                setBuilderState({ assetPlan: event.payload });
            }

            if (event.type === 'COMPLETE') {
                // End of planning phase
                setProjectStage('architecture'); // Stay in architecture for review
                showToast("Plan ready for review", "success");
            }

            if (event.type === 'ERROR') {
                showToast(event.payload, 'error');
            }
        });
    };

    const handleStartBuild = async () => {
        const providerId = state.currentProviderId || 'google';
        const apiKey = state.apiKeys[providerId];

        if (!apiKey && !process.env.NEXT_PUBLIC_NEXUS_API_KEY) {
            showToast(`API Key missing for ${providerId}`, 'error');
            return;
        }

        const activeKey = apiKey || process.env.NEXT_PUBLIC_NEXUS_API_KEY || "";

        setProjectStage('build');
        showToast("Building components...", "info");

        // We need the design system and assets from the previous phase. 
        // Currently these aren't persisted in global state fully (only sections are).
        // For now, we will assume the AI can infer or we need to persist them.
        // TODO: Persist full architecture state.
        // As a workaround for this refactor, we will rely on the sections we have
        // and potentially re-generate or assume context if data is missing.
        // Ideally, runPlanningPhase should save *all* artifacts to state.

        // Let's pass what we have.
        // Since we didn't update AppState to store DesignSystem/Assets, we might fail here.
        // FIX: Update AppState to store these or pass dummy for now to get flow working.

        await runBuildPhase(
            state.sections.map(s => ({ id: s.id, purpose: s.description })), // Minimal section info
            state.designSystem || {} as any,
            state.assetPlan || { section_assets: [] } as any,
            providerId,
            activeKey,
            state.currentModelId || "",
            (event: PipelineEvent) => {
                if (event.type === 'COMPONENT_GENERATED') {
                    const { sectionId, code } = event.payload;
                    const updatedSections = state.sections.map(s =>
                        s.id === sectionId ? { ...s, status: 'complete' as const } : s
                    );
                    updateSections(updatedSections);

                    const fileName = `${sectionId}.tsx`;
                    setCurrentFiles(prev => {
                        const exists = prev.find(f => f.name === fileName);
                        if (exists) return prev.map(f => f.name === fileName ? { ...f, content: code } : f);
                        return [...prev, { name: fileName, language: 'typescript', content: code, path: fileName }];
                    });
                    if (!activeFile) {
                        setActiveFile(fileName);
                        if (viewMode === 'plan') setViewMode('split');
                    }
                }

                if (event.type === 'COMPLETE') {
                    setProjectStage('refine');
                    setViewMode('split');
                    showToast("Build complete", "success");
                }
            }
        );
    };

    // Auto-hide global sidebar on mount
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
    }, [props.messages, activeFile]);

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

    const handleSave = async () => {
        if (!state.currentChatId) return;
        const codeToSave = previewContent || activeFileContent;
        if (!codeToSave) {
            showToast("No code to save yet", "info");
            return;
        }
        try {
            await updateChatCode(state.currentChatId, codeToSave);
            showToast("Website saved to project", "success");
        } catch (err) {
            showToast("Failed to save website", "error");
        }
    };

    // Resize Logic
    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            setSidebarWidth(Math.max(280, Math.min(e.clientX, 600)));
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

    const selectedSection = state.sections.find(s => s.id === state.selectedSectionId);

    return (
        <div className="flex flex-col h-full bg-[#09090b] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative">
            <WorkspaceBackground />
            {/* REMASTER HEADER */}
            <header className="h-14 shrink-0 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-4 z-[100] relative">
                <div className="flex items-center gap-4">
                    <button onClick={props.onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                    <div className="hidden lg:block">
                        <StageIndicator currentStage={state.projectStage} />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'chat', icon: LayoutPanelLeft, label: 'Flow' },
                            { id: 'split', icon: SquareSplitHorizontal, label: 'Code' },
                            { id: 'preview', icon: AppWindow, label: 'Preview' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as ViewMode)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                                    viewMode === mode.id
                                        ? "bg-white text-black shadow-xl"
                                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                )}
                            >
                                <mode.icon className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        <span>Publish</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* SIDEBAR (Architecture / Chat) */}
                <div
                    className="flex flex-col bg-[#09090b] border-r border-white/5 relative z-40 transition-[width] duration-300 ease-in-out"
                    style={{ width: viewMode === 'preview' ? 0 : sidebarWidth }}
                >
                    <div className="flex-1 overflow-hidden">
                        <ArchitectureSidebar
                            sections={state.sections}
                            selectedSectionId={state.selectedSectionId}
                            onSelectSection={selectSection}
                            onStartBuild={handleStartBuild}
                            isBuilding={state.projectStage === 'build'}
                        />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-50"
                    />
                </div>

                {/* PRIMARY CANVAS */}
                <div className="flex-1 flex flex-col bg-[#0c0c0e] relative">
                    <div className="flex-1 relative overflow-hidden">
                        {viewMode === 'split' && (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 relative">
                                    <CodeEditor code={activeFileContent} language={activeFileLang} onChange={handleCodeChange} />
                                </div>
                                <div className="h-8 bg-[#09090b] border-t border-white/5 flex items-center justify-between px-3 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                    <div className="flex items-center gap-2">
                                        <FileCode className="w-3 h-3 text-indigo-400" />
                                        <span>{activeFile}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span>UTF-8</span>
                                        <span>{activeFileLang}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'plan' && (
                            <PlanView state={{
                                stage: state.projectStage as any,
                                intent: state.siteIntent || null as any,
                                architecture: state.siteArchitecture || {
                                    sections: state.sections.map(s => ({
                                        id: s.id,
                                        name: s.title,
                                        type: 'generic',
                                        purpose: s.description,
                                        components: [],
                                        priority: 'medium'
                                    })),
                                    layout_strategy: '',
                                    responsive_rules: '',
                                    interaction_notes: '',
                                    navigation_structure: []
                                } as any,
                                designSystem: state.designSystem || null,
                                uxJourney: null,
                                assets: state.assetPlan || null,
                                currentStep: '',
                                progress: 0,
                                errors: []
                            }} />
                        )}

                        {(viewMode === 'preview' || viewMode === 'chat') && (
                            <div className={cn("h-full bg-white", viewMode === 'chat' && "bg-[#09090b]")}>
                                <LivePreviewPane
                                    code={previewContent}
                                    isStreaming={props.isStreaming}
                                />
                            </div>
                        )}
                    </div>

                    {/* FOOTER ACTION PANEL */}
                    <footer className="shrink-0 z-40 px-6 py-4 bg-[#09090b]/40 backdrop-blur-sm border-t border-white/5">
                        <div className="max-w-4xl mx-auto">
                            <StageActionPanel
                                onSendMessage={handleCommand}
                                selectedSectionTitle={selectedSection?.title}
                            />
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
