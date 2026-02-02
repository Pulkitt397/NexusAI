import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';

interface LivePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
}

export function LivePreviewModal({ isOpen, onClose, content }: LivePreviewModalProps) {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [key, setKey] = React.useState(0);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Build preview document from content
    const previewDoc = useMemo(() => {
        const extracted = extractPreviewableCode(content);
        return buildPreviewDocument(extracted);
    }, [content]);

    const handleRefresh = () => {
        setKey(prev => prev + 1);
    };

    const handleOpenExternal = () => {
        const blob = new Blob([previewDoc], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`fixed z-50 bg-[#0f0f10] border border-white/10 rounded-xl overflow-hidden shadow-2xl ${isFullscreen
                                ? 'inset-4'
                                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[80vh]'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-sm text-white/60 ml-2">Live Preview</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleOpenExternal}
                                    className="p-2 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Preview iframe */}
                        <div className="w-full h-[calc(100%-52px)] bg-white">
                            <iframe
                                ref={iframeRef}
                                key={key}
                                srcDoc={previewDoc}
                                sandbox="allow-scripts"
                                title="Live Preview"
                                className="w-full h-full border-0"
                                style={{ backgroundColor: 'white' }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
