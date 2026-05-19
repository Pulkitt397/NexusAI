import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context';
import { PROMPT_MODE_LABELS, type SystemPromptMode } from '@/systemPrompts';
import { cn } from '@/lib/utils';
import { ChevronRight, LayoutTemplate, SquareTerminal, AppWindow, Cpu, Sparkles, ChevronDown, Check, Loader2 } from 'lucide-react';

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
    const { state, selectProvider, selectModel } = useApp();
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);

    // Dropdown state
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            {/* Right: Mode Switcher & Model Selector Dropdown */}
            <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 mx-2 p-0.5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setWebDevMode(false)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer",
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
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer",
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

                {/* Model Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                    >
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold max-w-[120px] truncate text-white">
                            {currentModel?.name || "Select Model"}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 text-white/50" />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2">
                            {/* Provider Selection */}
                            <div>
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1.5 px-1">Provider</p>
                                <div className="grid grid-cols-4 gap-1">
                                    {state.providers.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => selectProvider(p.id)}
                                            title={p.name}
                                            className={cn(
                                                "flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer gap-1.5",
                                                state.currentProviderId === p.id
                                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                                                    : "bg-white/5 border-transparent text-white/40 hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            <img
                                                src={`/logos/${p.id}.svg`}
                                                alt={p.name}
                                                className="w-4 h-4 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            <span className="text-[9px] font-bold truncate max-w-[45px] uppercase tracking-wider">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="h-px bg-white/5 my-1" />

                            {/* Models List */}
                            <div>
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1.5 px-1">Available Models</p>
                                <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                                    {state.isLoadingModels ? (
                                        <div className="flex items-center justify-center py-4 gap-2 text-white/40 text-xs">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                            <span>Loading models...</span>
                                        </div>
                                    ) : state.availableModels.length === 0 ? (
                                        <div className="text-center py-4 text-white/30 text-xs">
                                            No models found. Configure your API key in Settings.
                                        </div>
                                    ) : (
                                        state.availableModels.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    selectModel(m.id);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all cursor-pointer",
                                                    state.currentModelId === m.id
                                                        ? "bg-indigo-500/10 text-indigo-300 font-medium"
                                                        : "text-white/50 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <span className="truncate pr-4">{m.name}</span>
                                                {state.currentModelId === m.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
