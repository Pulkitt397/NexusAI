// Main App Component
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context';
import { useAuth } from '@/context/AuthContext';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { SettingsModal } from '@/components/SettingsModal';
import { MemoryModal } from '@/components/MemoryModal';
import { AuthPage } from '@/components/AuthPage';
import { PROMPT_MODE_LABELS } from '@/systemPrompts';
import { AnimatePresence, motion } from 'framer-motion';

import { SelectionMenu } from '@/components/ui/SelectionMenu';
import { WebDevEnvironment } from '@/components/WebDevEnvironment';

// Layout Components
import { Sidebar } from '@/components/layout/Sidebar';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';

export default function App() {
    const { user, loading: authLoading } = useAuth();
    const {
        state,
        sendMessage,
        createChat,
        selectChat,
        deleteChat,
        selectProvider,
        selectModel,
        setPromptMode,
        openModal,
        closeModal,
        enhancePrompt,
        setSearchMode
    } = useApp();

    // Local UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isWebDevMode, setIsWebDevMode] = useState(false);

    // Responsive Check
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Show auth page if not logged in
    if (authLoading) {
        return (
            <div className="min-h-screen w-screen bg-[#09090b] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-white/40 text-sm">Loading...</p>
                </motion.div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    // Derived Data
    const currentProvider = state.providers.find(p => p.id === state.currentProviderId);
    const currentModel = state.availableModels.find(m => m.id === state.currentModelId);
    const formattedMessages = state.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        webResult: m.webResult
    }));
    const enabledMemoryCount = state.memories.filter(m => m.enabled).length;



    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-white font-sans antialiased selection:bg-indigo-500/30">
            {/* 1. Sidebar */}
            <Sidebar
                isMobile={isMobile}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">

                {/* 3. Global Workspace Actions/Header */}
                <WorkspaceHeader
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isWebDevMode={isWebDevMode}
                    setWebDevMode={setIsWebDevMode}
                />

                {/* 4. Canvas (Chat or WebDev) */}
                <main className="flex-1 relative overflow-hidden bg-[#09090b]">
                    {isWebDevMode ? (
                    <WebDevEnvironment
                            onClose={() => setIsWebDevMode(false)}
                        />
                    ) : (
                        <div className="h-full flex flex-col">
                            <AnimatedAIChat
                                onSendMessage={sendMessage}
                                isStreaming={state.isStreaming}
                                streamingContent={state.streamingContent}
                                messages={formattedMessages}
                                onOpenMemory={() => openModal('memory')}
                                onOpenSettings={() => openModal('apiKey')}
                                memoryCount={enabledMemoryCount}
                                currentModel={currentModel?.name || null}
                                onEnhance={enhancePrompt}
                                searchMode={state.searchMode}
                                onSetSearchMode={setSearchMode}
                                isSearching={state.isSearching}
                                availableModels={state.availableModels}
                                currentModelId={state.currentModelId}
                                onSelectModel={selectModel}
                                providers={state.providers}
                                currentProviderId={state.currentProviderId}
                                onSelectProvider={selectProvider}
                            />
                        </div>
                    )}
                </main>
            </div>

            {/* Global Modals & Overlays */}
            <SettingsModal
                isOpen={state.modalOpen === 'apiKey'}
                onClose={closeModal}
            />
            <MemoryModal
                isOpen={state.modalOpen === 'memory'}
                onClose={closeModal}
            />
            <SelectionMenu
                onAction={(action, text) => {
                    const prompt = action === 'explain'
                        ? `Explain this text in detail: "${text}"`
                        : action === 'summarize'
                            ? `Summarize this text: "${text}"`
                            : `Translate this text to English (or identify the language and translate to English): "${text}"`;
                    sendMessage(prompt);
                }}
            />
        </div>
    );
}
