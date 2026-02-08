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
    const previewDoc = useMemo(() => {
        if (!code) return '';

        // Remove <thinking> and <plan> tags for the preview
        const cleanCode = code.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').replace(/<plan>[\s\S]*?<\/plan>/gi, '').trim();

        // Basic protection against infinite loops/alerts
        const safeCode = cleanCode.replace(/alert\(/g, 'console.log("Alert blocked":').replace(/window\.open/g, 'console.log("Popup blocked":');

        // Check if it's potentially React/JSX code
        const isReact = safeCode.includes('import') || safeCode.includes('export default') || safeCode.includes('useState') || safeCode.includes('useEffect') || safeCode.includes('className=');

        if (isReact) {
            return `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <script src="https://cdn.tailwindcss.com"></script>
                        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                        <script type="importmap">
                        {
                            "imports": {
                                "react": "https://esm.sh/react@18.2.0",
                                "react-dom": "https://esm.sh/react-dom@18.2.0/client",
                                "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
                                "framer-motion": "https://esm.sh/framer-motion",
                                "lucide-react": "https://esm.sh/lucide-react"
                            }
                        }
                        </script>
                        <style>
                            body { margin: 0; padding: 0; background-color: #030014; color: white; min-height: 100vh; }
                            #root { min-height: 100vh; }
                        </style>
                    </head>
                    <body>
                        <div id="root"></div>
                        <script type="text/babel" data-presets="react,typescript" data-type="module">
                            import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
                            import { createRoot } from 'react-dom/client';
                            import { motion, AnimatePresence } from 'framer-motion';
                            import * as LucideIcons from 'lucide-react';

                            // Expose icons globally for easier access
                            window.LucideIcons = LucideIcons;

                            ${safeCode.replace(/export default function/g, 'function App').replace(/export function/g, 'function')}

                            // Render Logic
                            try {
                                const root = createRoot(document.getElementById('root'));
                                if (typeof App !== 'undefined') {
                                    root.render(<App />);
                                } else {
                                    // Try to find the first function starting with a capital letter
                                    const components = Object.keys(window).filter(key => /^[A-Z]/.test(key) && typeof window[key] === 'function');
                                    if (components.length > 0) {
                                        const Comp = window[components[0]];
                                        root.render(<Comp />);
                                    } else {
                                        document.body.innerHTML = '<div style="padding: 20px; color: #ffab00;">Error: No React component found to render. Please ensure you have an App component or a exported function.</div>';
                                    }
                                }
                            } catch (err) {
                                console.error('Render error:', err);
                                document.body.innerHTML = '<div style="padding: 20px; color: #ff5252;">Render Error: ' + err.message + '</div>';
                            }
                        </script>
                    </body>
                </html>
            `.trim();
        }

        // If it's a full HTML doc, use it but inject Tailwind
        if (safeCode.includes('<!DOCTYPE html>') || safeCode.includes('<html')) {
            if (!safeCode.includes('tailwindcss')) {
                return safeCode.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script></head>');
            }
            return safeCode;
        }

        // Otherwise, wrap it with Tailwind support
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 0; margin: 0; }
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
            iframeRef.current.srcdoc = previewDoc;
        }
    }, [previewDoc, key]);

    const handleReload = () => {
        setKey(prev => prev + 1);
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0f12] border-l border-white/10">
            {/* Toolbar */}
            <div className="h-10 shrink-0 flex items-center justify-between px-3 border-b border-white/5 bg-[#09090b] select-none">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                        <button
                            onClick={() => setDeviceMode('desktop')}
                            className={cn(
                                "p-1 rounded-md transition-all",
                                deviceMode === 'desktop' ? "bg-[#27272a] text-white shadow-sm ring-1 ring-black/20" : "text-white/40 hover:text-white/60"
                            )}
                            title="Desktop View"
                        >
                            <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setDeviceMode('mobile')}
                            className={cn(
                                "p-1 rounded-md transition-all",
                                deviceMode === 'mobile' ? "bg-[#27272a] text-white shadow-sm ring-1 ring-black/20" : "text-white/40 hover:text-white/60"
                            )}
                            title="Mobile View"
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <span className="text-xs font-mono text-white/40 truncate max-w-[200px]">
                        {code.includes('import') ? 'App.tsx' : 'index.html'}
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
