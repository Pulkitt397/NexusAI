import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePreviewPaneProps {
    code: string;
    isStreaming?: boolean;
}

export function LivePreviewPane({ code, isStreaming }: LivePreviewPaneProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [key, setKey] = React.useState(0);
    const [deviceMode, setDeviceMode] = React.useState<'desktop' | 'mobile'>('desktop');

    // Extract HTML, CSS, JS from the code block if mixed, or assume HTML if single block
    // For now, we'll assume the LLM generates a single HTML file or we wrap it.
    // robust extraction logic handled in buildPreviewDocument in utils, but we can do it here too.

    const previewDoc = useMemo(() => {
        if (!code) return '';
        // Basic protection against infinite loops/alerts
        const safeCode = code.replace(/alert\(/g, 'console.log("Alert blocked":').replace(/window\.open/g, 'console.log("Popup blocked":');

        // If it's a full HTML doc, use it
        if (safeCode.includes('<!DOCTYPE html>') || safeCode.includes('<html')) {
            return safeCode;
        }

        // Otherwise, wrap it
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
                        /* Add some basic reset */
                        * { box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    ${safeCode}
                </body>
            </html>
        `;
    }, [code]);

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(previewDoc);
                doc.close();
            }
        }
    }, [previewDoc, key]);

    const handleReload = () => {
        setKey(prev => prev + 1);
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0f12] border-l border-white/10">
            {/* Toolbar */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#1a1a1c]/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                        <button
                            onClick={() => setDeviceMode('desktop')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                deviceMode === 'desktop' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                            )}
                            title="Desktop View"
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDeviceMode('mobile')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                deviceMode === 'mobile' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                            )}
                            title="Mobile View"
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <span className="text-xs font-mono text-white/40 truncate max-w-[200px]">
                        index.html
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isStreaming && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                            <span className="text-[10px] font-medium text-violet-300">Generating...</span>
                        </div>
                    )}
                    <button
                        onClick={handleReload}
                        className="p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                        title="Reload Frame"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 relative bg-[radial-gradient(#2a2a30_1px,transparent_1px)] [background-size:20px_20px] bg-[#050507] flex items-center justify-center p-4 overflow-hidden">
                <motion.div
                    layout
                    className={cn(
                        "relative bg-white shadow-2xl overflow-hidden transition-all duration-500",
                        deviceMode === 'mobile' ? "w-[375px] h-[667px] rounded-[30px] border-[8px] border-[#1a1a1c]" : "w-full h-full rounded-lg border border-white/10"
                    )}
                >
                    {!code ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                            <div className="p-4 rounded-full bg-white/5 mb-4">
                                <Monitor className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">No preview available</p>
                            <p className="text-xs mt-2 opacity-50">Generate HTML/CSS to see it here</p>
                        </div>
                    ) : (
                        <iframe
                            ref={iframeRef}
                            key={key}
                            title="Live Preview"
                            className="w-full h-full bg-white"
                            sandbox="allow-scripts allow-same-origin allow-popups-to-escape-sandbox allow-forms"
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
