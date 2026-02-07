// Code detection utility for Live Preview feature

export interface ExtractedCode {
    html: string;
    css: string;
    js: string;
    tsx: string;
    type: 'html' | 'react';
    hasPreviewableContent: boolean;
    files: Array<{ name: string; language: string; content: string }>;
}

/**
 * Detects if message content contains previewable HTML/CSS/JS/TSX code
 */
export function extractPreviewableCode(content: string): ExtractedCode {
    let html = '';
    let css = '';
    let js = '';
    let tsx = '';
    let type: 'html' | 'react' = 'html';
    const files: Array<{ name: string; language: string; content: string }> = [];

    // Extract code blocks with filenames
    // Regex matches:
    // 1. Optional "Filename: name.ext" (case insensitive) followed by newline or space
    // 2. Code block start ```lang
    // 3. Content
    // 4. Code block end ```

    // We iterate line by line or block by block to capture context
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    // Helper to find filename preceding the match
    const findFilename = (index: number, fullText: string): string | null => {
        // Look back from the start of the code block
        const precedingText = fullText.substring(0, index).trim();
        const lines = precedingText.split('\n');
        if (lines.length === 0) return null;

        // Check last few lines for "Filename: x"
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
            const line = lines[i].trim();
            const fileMatch = line.match(/Filename:\s*([`"']?)([\w./-]+)\1/i);
            if (fileMatch) return fileMatch[2];
            // Also check comment style // Filename: x or <!-- Filename: x -->
            const commentMatch = line.match(/(?:\/\/|<!--)\s*Filename:\s*([`"']?)([\w./-]+)\1/i);
            if (commentMatch) return commentMatch[2];
        }
        return null;
    };

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = (match[1] || '').toLowerCase();
        const code = match[2].trim();
        const index = match.index;

        let filename = findFilename(index, content);

        // Auto-assign filename if missing based on language or content
        if (!filename) {
            if (language === 'html' || code.includes('<!DOCTYPE html>')) filename = 'index.html';
            else if (language === 'css') filename = 'styles.css';
            else if (language === 'js' || language === 'javascript') filename = 'script.js';
            else if (language === 'tsx' || language === 'jsx' || language === 'react') filename = 'App.tsx';
            else filename = `file.${language || 'txt'}`;
        }

        // Add to files list
        files.push({ name: filename, language: language || 'text', content: code });

        // Populate legacy fields for preview generation
        if (filename === 'index.html' || (language === 'html' && !html)) {
            html += code + '\n';
        } else if (filename === 'styles.css' || (language === 'css' && !css)) {
            css += code + '\n';
        } else if (filename === 'script.js' || (language === 'js' && !js)) {
            js += code + '\n';
        } else if (filename === 'App.tsx' || (language === 'tsx' && !tsx)) {
            tsx += code + '\n';
        }
    }

    // Determine type
    // If we have explicit React/TSX code, or if the JS code looks like React (imports React)
    if (tsx || (js.includes('import React') || js.includes('return <') || js.includes('className='))) {
        type = 'react';
        // If JS was actually React code but labeled JS, move it to TSX accumulator for Babel processing
        if (js && !tsx) {
            tsx = js;
            js = '';
        }
    }

    // Check for inline HTML document (full page) if logic above missed it (e.g. no filename)
    if (!html && (content.includes('<!DOCTYPE html>') || content.includes('<html'))) {
        const htmlMatch = content.match(/```(?:html)?\n(<!DOCTYPE[\s\S]*?<\/html>)\n```/i);
        if (htmlMatch) {
            html = htmlMatch[1];
            if (!files.some(f => f.name === 'index.html')) {
                files.push({ name: 'index.html', language: 'html', content: html });
            }
        }
    }

    const hasPreviewableContent = files.length > 0;

    return { html, css, js, tsx, type, hasPreviewableContent, files };
}

/**
 * Combines extracted code into a single HTML document for preview
 */
export function buildPreviewDocument(extracted: ExtractedCode): string {
    const { html, css, js, tsx, type } = extracted;

    if (type === 'react') {
        const processedCode = processReactCode(tsx || js);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        violet: { 500: '#8b5cf6' },
                        neutral: { 900: '#171717' }
                    }
                }
            }
        }
    </script>
    <style>
        body { background: #000; color: #fff; padding: 0; margin: 0; }
        #root { width: 100%; height: 100%; }
        /* Loader */
        .preview-loader { display: flex; justify-content: center; align-items: center; height: 100vh; color: #888; font-family: sans-serif; }
        ${css}
    </style>
    <!-- Import Map for React and key libraries -->
    <script type="importmap">
    {
        "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "framer-motion": "https://esm.sh/framer-motion@10.16.4",
            "lucide-react": "https://esm.sh/lucide-react@0.292.0",
            "clsx": "https://esm.sh/clsx",
            "tailwind-merge": "https://esm.sh/tailwind-merge"
        }
    }
    </script>
    <!-- Babel for transpilation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root">
        <div class="preview-loader">Initializing Preview...</div>
    </div>

    <script type="text/babel" data-type="module">
        import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
        import { createRoot } from 'react-dom/client';
        import * as Lucide from 'lucide-react';
        import * as Framer from 'framer-motion';

        // Error boundary helper
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }
            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }
            render() {
                if (this.state.hasError) {
                    return (
                        <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-200 rounded-lg">
                            <h3 className="font-bold mb-2">Runtime Error</h3>
                            <pre className="text-xs overflow-auto">{this.state.error.toString()}</pre>
                        </div>
                    );
                }
                return this.props.children;
            }
        }

        try {
            /** USER CODE INJECTION **/
            ${processedCode}

            /** MOUNT LOGIC **/
            // Try to find the component
            let ComponentToRender = null;
            
            // Heuristic to find the main component
            if (typeof App !== 'undefined') ComponentToRender = App;
            else if (typeof Main !== 'undefined') ComponentToRender = Main;
            else if (typeof DefaultExport !== 'undefined') ComponentToRender = DefaultExport;
            else if (typeof Page !== 'undefined') ComponentToRender = Page;
            else if (typeof Dashboard !== 'undefined') ComponentToRender = Dashboard;
            else if (typeof Landing !== 'undefined') ComponentToRender = Landing;
            else {
                // Fallback: Check for any function that looks like a component (Capitalized)
            }

            if (ComponentToRender) {
                const root = createRoot(document.getElementById('root'));
                root.render(
                    <ErrorBoundary>
                        <ComponentToRender />
                    </ErrorBoundary>
                );
            } else {
                 console.warn("No main component found. Looking for default export or common names.");
                 const root = createRoot(document.getElementById('root'));
                 root.render(
                    <div className="text-white/50 text-sm flex flex-col items-center justify-center h-screen">
                        <p>No component named 'App', 'Main', 'Page', 'Dashboard' found.</p>
                        <p className="mt-2 text-xs opacity-50">Ensure you define: <code>export default function App() {'{...}'}</code></p>
                    </div>
                 );
            }
        } catch (err) {
            console.error("Preview mounting error:", err);
            const root = createRoot(document.getElementById('root'));
            root.render(
                 <div className="p-4 bg-red-900/20 text-red-200">
                    <h3 className="font-bold">Preview Error</h3>
                    <pre>{err.message}</pre>
                 </div>
            );
        }
    </script>
</body>
</html>`;
    }

    // Default HTML/JS Preview
    // Build a complete document from fragments
    // Inject CSS if missing
    let fullHtml = html;
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; }
        @media (prefers-color-scheme: dark) {
            body { background: #000; color: #fff; }
        }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    </script>
</body>
</html>`;
    } else {
        // Inject JS/CSS into existing HTML
        if (css && !fullHtml.includes(css)) {
            fullHtml = fullHtml.replace('</head>', `<style>${css}</style></head>`);
        }
        if (js && !fullHtml.includes(js)) {
            fullHtml = fullHtml.replace('</body>', `<script>${js}</script></body>`);
        }
    }
    return replaceAssetUrls(fullHtml);
}

function processReactCode(code: string): string {
    // 1. Rewrite imports to use esm.sh
    // This allows `import { motion } from 'framer-motion'` to work in browser via Import Map
    // We already added the importmap in the HTML template.

    let clean = code
        // Universal replacement for export default -> const DefaultExport =
        // Works for: export default function App() {} -> const DefaultExport = function App() {}
        // Works for: export default class App {} -> const DefaultExport = class App {}
        // Works for: export default () => {} -> const DefaultExport = () => {}
        .replace(/export\s+default\s+/g, 'const DefaultExport = ')
        .replace(/export\s+/g, ''); // Remove named exports to keep code valid

    // We don't need to remove imports if we use importmap!
    // But we need to ensure the standard imports match the importmap keys.
    // e.g. "import ... from 'lucide-react'" matches "lucide-react" key.

    // Apply asset URL replacement
    clean = replaceAssetUrls(clean);

    return clean;
}

/**
 * Replaces nexus-asset.local placeholders with real playable URLs
 */
function replaceAssetUrls(content: string): string {
    return content
        // Images: https://nexus-asset.local/image/query -> Pollinations
        .replace(/https:\/\/nexus-asset\.local\/image\/([^"'\s)]+)/g, (match, query) => {
            const encoded = encodeURIComponent(query.replace(/\+/g, ' '));
            return `https://image.pollinations.ai/prompt/${encoded}?nologo=true&width=1024&height=600&seed=${Math.floor(Math.random() * 9999)}`;
        })
        // Icons: https://nexus-asset.local/icon/name -> Lucide Static
        .replace(/https:\/\/nexus-asset\.local\/icon\/([^"'\s)]+)/g, (match, name) => {
            return `https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${name.toLowerCase()}.svg`;
        });
}

/**
 * Quick check if content might be previewable (for button visibility)
 */
export function isPreviewable(content: string): boolean {
    const hasHtmlBlock = /```(html|htm)/i.test(content);
    const hasCssBlock = /```css/i.test(content);
    const hasJsBlock = /```(javascript|js)/i.test(content);
    const hasTsxBlock = /```(tsx|jsx|react|typescript)/i.test(content);
    const hasFullDoc = /<!DOCTYPE html>/i.test(content) || /<html/i.test(content);

    // Also check for raw code patterns if blocks missing (less reliable but useful)
    const looksLikeReact = /import React/.test(content) || /export default function/.test(content);

    return hasHtmlBlock || hasFullDoc || hasTsxBlock || (hasCssBlock && hasJsBlock) || looksLikeReact;
}
