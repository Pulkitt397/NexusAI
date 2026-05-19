
import { useApp } from '@/context';
import { PROMPT_MODE_LABELS, type SystemPromptMode } from '@/systemPrompts';
import { cn } from '@/lib/utils';
import { ChevronRight, LayoutTemplate, SquareTerminal, AppWindow, Cpu, Sparkles } from 'lucide-react';

export function WorkspaceHeader({
    isSidebarOpen,
    toggleSidebar,
    isWebDevMode,
    setWebDevMode
}: {
    isSidebarOpen: boolean,
    toggleSidebar: () => void,
    isWebDevMode: boolean,
    setWebDevMode: (v: boolean) => void
}) {
    const { state } = useApp();
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);

    return (
        <header className="h-12 border-b border-white/5 bg-[#09090b] flex items-center justify-between px-4 sticky top-0 z-30">
            {/* Left: Breadcrumbs / Context */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                </button>

                <div className="h-4 w-[1px] bg-white/10" />

                <div className="flex items-center gap-2 text-sm text-white/50">
                    <span className="flex items-center gap-1.5 hover:text-white/80 transition-colors cursor-pointer">
                        <AppWindow className="w-3.5 h-3.5" />
                        Workspace
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className={cn(
                        "flex items-center gap-1.5 font-medium px-2 py-1 rounded",
                        isWebDevMode ? "bg-violet-500/10 text-violet-400" : "bg-indigo-500/10 text-indigo-400"
                    )}>
                        {isWebDevMode ? <LayoutTemplate className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {isWebDevMode ? "Nexus Studio" : "Chat"}
                    </span>
                </div>
            </div>

            {/* Right: Mode Switcher & Status */}
            <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 mx-2 p-0.5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setWebDevMode(false)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                            !isWebDevMode
                                ? "bg-[#27272a] text-white shadow-sm ring-1 ring-black/20"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Chat
                    </button>
                    <button
                        onClick={() => setWebDevMode(true)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                            isWebDevMode
                                ? "bg-[#27272a] text-white shadow-sm ring-1 ring-black/20"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        Studio
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-white/10" />

                <div className="flex items-center gap-2 text-xs text-white/30">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{currentModel?.name || "No Model"}</span>
                </div>
            </div>
        </header>
    );
}
