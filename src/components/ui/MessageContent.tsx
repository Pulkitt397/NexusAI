// MessageContent - Renders markdown with syntax highlighting + Live Preview
import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPreviewable, extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { SmartImage } from '@/components/ui/SmartImage';

// Stable, lightweight syntax highlighting
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register essential languages only (avoids bundle bloat)
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

// Register languages (safely) to prevent module-level crashes
const registerLanguages = () => {
    try {
        SyntaxHighlighter.registerLanguage('tsx', tsx);
        SyntaxHighlighter.registerLanguage('typescript', typescript);
        SyntaxHighlighter.registerLanguage('ts', typescript);
        SyntaxHighlighter.registerLanguage('javascript', javascript);
        SyntaxHighlighter.registerLanguage('js', javascript);
        SyntaxHighlighter.registerLanguage('jsx', jsx);
        SyntaxHighlighter.registerLanguage('css', css);
        SyntaxHighlighter.registerLanguage('html', html);
        SyntaxHighlighter.registerLanguage('xml', html);
        SyntaxHighlighter.registerLanguage('markup', html);
        SyntaxHighlighter.registerLanguage('json', json);
        SyntaxHighlighter.registerLanguage('bash', bash);
        SyntaxHighlighter.registerLanguage('sh', bash);
        SyntaxHighlighter.registerLanguage('python', python);
        SyntaxHighlighter.registerLanguage('py', python);
        SyntaxHighlighter.registerLanguage('markdown', markdown);
        SyntaxHighlighter.registerLanguage('md', markdown);
    } catch (e) {
        console.warn("Language registration failed:", e);
    }
};

// Execute registration
registerLanguages();

// ==========================================
// ERROR BOUNDARY (CRASH PROTECTION)
// ==========================================
// Wraps the syntax highlighter to prevent white/black screen of death
class HighlighterErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("SyntaxHighlighter crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

interface MessageContentProps {
    content: string;
    className?: string;
    isStreaming?: boolean;
}

const CodeBlock = React.memo(({
    children,
    className,
    inline,
    isStreaming
}: {
    children: string;
    className?: string;
    inline?: boolean;
    isStreaming?: boolean;
}) => {
    const [copied, setCopied] = useState(false);

    const match = /language-(\w+)/.exec(className || '');
    let language = match ? match[1].toLowerCase() : 'text';
    if (language === 'txt') language = 'text';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[0.9em] font-mono">
                {children}
            </code>
        );
    }

    // Optimization: During streaming, avoid heavy tokenization for large blocks if possible, 
    // but users prefer seeing colors. We will trust React.memo and Virtuoso to handle the list.
    // However, we prevent the "Copy" button from flickering or layout shifting.

    return (
        <motion.div
            className="relative group my-4"
            initial={false} // Disable initial animation during streaming updates
            animate={{ opacity: 1 }}
        >
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] rounded-t-lg border-b border-white/5">
                <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                    {language === 'javascript' ? 'JS' : language === 'typescript' ? 'TS' : language}
                </span>
                {!isStreaming && (
                    <motion.button
                        onClick={handleCopy}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all",
                            copied
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {copied ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    <span>Copied!</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="copy"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex items-center gap-1"
                                >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </div>

            <div className="relative rounded-b-lg border border-t-0 border-white/5 shadow-lg shadow-black/20 max-h-[50vh] overflow-auto bg-[#0d0d12]">
                <HighlighterErrorBoundary
                    fallback={
                        <pre className="p-4 m-0 bg-transparent font-mono text-sm text-white/80 overflow-x-auto whitespace-pre">
                            {children}
                        </pre>
                    }
                >
                    <SyntaxHighlighter
                        style={oneDark}
                        language={language}
                        PreTag="div"
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            }
                        }}
                    >
                        {children}
                    </SyntaxHighlighter>
                </HighlighterErrorBoundary>
                <div className="absolute inset-0 pointer-events-none rounded-b-lg ring-1 ring-inset ring-white/[0.03]" />
            </div>
        </motion.div>
    );
});


export function MessageContent({ content, className, isStreaming }: MessageContentProps) {
    // Memoize the check
    const canPreview = useMemo(() => isPreviewable(content), [content]);

    const handleLivePreview = () => {
        try {
            const extracted = extractPreviewableCode(content);
            const previewDoc = buildPreviewDocument(extracted);

            // robust open: open blank, then write
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.open();
                newWindow.document.write(previewDoc);
                newWindow.document.close();
            } else {
                alert("Popup was blocked! Please allow popups for this site to see the Live Preview.");
            }
        } catch (e) {
            console.error("Failed to open preview:", e);
            alert("Failed to generate preview. See console for details.");
        }
    };

    return (
        <div className={cn("relative w-full overflow-hidden", className)}>
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0 break-words overflow-hidden">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                            return (
                                <CodeBlock
                                    className={className}
                                    inline={inline}
                                    isStreaming={isStreaming}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </CodeBlock>
                            );
                        },
                        img: (props: any) => (
                            <SmartImage {...props} />
                        )
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {canPreview && !isStreaming && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleLivePreview}
                    className="flex items-center gap-2 px-3 py-1.5 mt-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-all border border-emerald-500/30"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Live Preview
                </motion.button>
            )}
        </div>
    );
}
