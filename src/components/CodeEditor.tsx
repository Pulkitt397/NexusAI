import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, Copy, Check, Download, Command, Settings, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (newCode: string) => void;
}

export function CodeEditor({ code, language, onChange }: CodeEditorProps) {
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLDivElement>(null);

    // Sync scrolling
    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm relative overflow-hidden rounded-lg border border-white/10 shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5 select-none">
                <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-300 font-medium tracking-wide">index.html</span>
                    <span className="text-[10px] text-white/30 ml-2">UTF-8</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors text-xs text-white/60 hover:text-white"
                        title="Copy Code"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 overflow-hidden group">
                {/* Syntax Highlighter (Background) */}
                <div
                    ref={preRef}
                    className="absolute inset-0 pointer-events-none p-4 overflow-hidden"
                    aria-hidden="true"
                >
                    <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            padding: 0,
                            background: 'transparent',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            fontFamily: '"Fira Code", monospace',
                        }}
                        wrapLines={true}
                        showLineNumbers={true}
                        lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#858585', textAlign: 'right' }}
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>

                {/* Textarea (Foreground - Editable) */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none font-mono text-sm leading-[1.5] z-10"
                    style={{
                        fontFamily: '"Fira Code", monospace',
                        // Add padding to match SyntaxHighlighter's line numbers + padding
                        paddingLeft: '4.5rem', // 2.5em + 1em + 16px (approx)
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#007acc] text-white text-[10px]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Command className="w-3 h-3" />
                        <span>MASTER</span>
                    </div>
                    <span>0 ERRORS</span>
                </div>
                <div className="flex items-center gap-3">
                    <span>Ln 1, Col 1</span>
                    <span>HTML</span>
                    <span>Prettier</span>
                </div>
            </div>
        </div>
    );
}
