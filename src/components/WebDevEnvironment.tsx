import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context';
import { runPlanningPhase, runBuildPhase, PipelineEvent } from '@/ai/pipeline';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import {
  FileCode, Play, Layout, Download, PanelLeft, X, CheckCircle2,
  Loader2, Code2, Eye, Maximize2, Minimize2, ChevronRight,
  FolderOpen, Zap, Terminal, FolderTree, Layers, Sparkles,
  Monitor, Smartphone, Tablet, Copy, FileText, Palette,
  Box, ArrowRight, RefreshCw, Package, AlertCircle, Info,
  Check, ChevronDown, ChevronRight as ChevronRightIcon,
  Settings2, Trash2, Plus, GitBranch, Clock, Zap as ZapIcon
} from 'lucide-react';

interface WebDevFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  type: 'component' | 'style' | 'asset' | 'config' | 'page';
}

interface ConsoleMessage {
  id: string;
  type: 'info' | 'error' | 'warn' | 'success' | 'system';
  message: string;
  timestamp: Date;
}

type EditorView = 'code' | 'preview' | 'split' | 'blueprint';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type BottomPanel = 'terminal' | 'output' | 'none';

interface WebDevEnvironmentProps {
  onClose: () => void;
}

export function WebDevEnvironment({ onClose }: WebDevEnvironmentProps) {
  const { state, sendMessage, showToast, setProjectStage, updateSections, selectSection, setBuilderState, updateChatCode } = useApp();

  // Layout
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorView, setEditorView] = useState<EditorView>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Files
  const [files, setFiles] = useState<WebDevFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components']));

  // Preview
  const [previewContent, setPreviewContent] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Build
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildPhase, setBuildPhase] = useState<'planning' | 'building' | 'done' | null>(null);
  const [buildSteps, setBuildSteps] = useState<Array<{ label: string; status: 'pending' | 'active' | 'done' | 'error' }>>([]);

  // Input
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Console
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Blueprint
  const [showBlueprint, setShowBlueprint] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);

  const addConsole = useCallback((type: ConsoleMessage['type'], message: string) => {
    setConsoleMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleMessages]);

  // Handle prompt
  const handleSubmit = async (content: string) => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setInputValue('');
    addConsole('system', `> ${content}`);

    try {
      if (state.projectStage === 'intent') {
        await startBuildPipeline(content);
      } else {
        addConsole('info', 'Sending refinement request...');
        await sendMessage(content);
        addConsole('success', 'Refinement processed');
      }
    } catch (error: any) {
      addConsole('error', `Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startBuildPipeline = async (prompt: string) => {
    if (!state.currentProviderId || !state.currentModelId) {
      showToast('Please select a provider and model first', 'error');
      return;
    }
    const apiKey = state.apiKeys[state.currentProviderId];
    if (!apiKey) {
      showToast('Please add an API key', 'error');
      return;
    }

    setIsBuilding(true);
    setBuildPhase('planning');
    setBuildProgress(0);
    setBuildSteps([
      { label: 'Analyzing intent', status: 'active' },
      { label: 'Architecture planning', status: 'pending' },
      { label: 'Design system generation', status: 'pending' },
      { label: 'UX flow design', status: 'pending' },
      { label: 'Asset collection', status: 'pending' },
    ]);
    addConsole('system', 'Starting build pipeline...');

    await runPlanningPhase(prompt, state.currentProviderId, apiKey, state.currentModelId, (event: PipelineEvent) => {
      switch (event.type) {
        case 'INTENT_GENERATED':
          setBuilderState({ siteIntent: event.payload });
          setBuildProgress(15);
          setBuildSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s));
          addConsole('success', `Intent: ${event.payload.goal}`);
          addConsole('info', `Site type: ${event.payload.site_type}`);
          break;
        case 'ARCHITECTURE_GENERATED':
          setBuilderState({ siteArchitecture: event.payload });
          const sections = event.payload.sections.map((s: any, idx: number) => ({
            id: s.id, title: s.name, description: s.purpose, status: 'pending' as const, order: idx
          }));
          updateSections(sections);
          setBuildProgress(30);
          setBuildSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'active' } : s));
          addConsole('success', `Architecture: ${event.payload.sections.length} sections planned`);
          break;
        case 'DESIGN_GENERATED':
          setBuilderState({ designSystem: event.payload });
          setBuildProgress(45);
          setBuildSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done' } : i === 3 ? { ...s, status: 'active' } : s));
          addConsole('success', `Design system: ${event.payload.color_palette ? Object.keys(event.payload.color_palette).length : 0} colors defined`);
          break;
        case 'UX_GENERATED':
          setBuildProgress(60);
          setBuildSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'done' } : i === 4 ? { ...s, status: 'active' } : s));
          addConsole('success', 'UX flow designed');
          break;
        case 'ASSET_GENERATED':
          setBuilderState({ assetPlan: event.payload });
          setBuildProgress(75);
          setBuildSteps(prev => prev.map((s, i) => i === 4 ? { ...s, status: 'done' } : s));
          addConsole('success', 'Assets collected');
          addConsole('system', 'Planning complete. Starting build phase...');
          setTimeout(() => startBuildPhase(), 500);
          break;
        case 'COMPLETE':
          setBuildProgress(100);
          break;
        case 'ERROR':
          showToast(event.payload, 'error');
          addConsole('error', event.payload);
          setIsBuilding(false);
          setBuildPhase(null);
          break;
      }
    });
  };

  const startBuildPhase = async () => {
    const providerId = state.currentProviderId || 'google';
    const apiKey = state.apiKeys[providerId] || '';
    setBuildPhase('building');
    setBuildProgress(0);
    setBuildSteps(state.sections.map(s => ({ label: `Building ${s.title}`, status: 'pending' as const })));
    addConsole('system', `Building ${state.sections.length} components...`);

    const sectionsWithNames = state.sections.map(s => ({
      id: s.id,
      name: s.title,
      purpose: s.description,
    }));

    await runBuildPhase(
      sectionsWithNames,
      (state as any).siteArchitecture || { sections: [] },
      state.assetPlan || { section_assets: [] },
      providerId,
      apiKey,
      state.currentModelId || '',
      (event: PipelineEvent) => {
        if (event.type === 'COMPONENT_GENERATED') {
          const { sectionId, code } = event.payload;
          const section = state.sections.find(s => s.id === sectionId);

          const newFile: WebDevFile = {
            id: sectionId,
            name: `${sectionId}.tsx`,
            path: `src/components/${sectionId}.tsx`,
            language: 'typescript',
            content: code,
            type: 'component'
          };

          setFiles(prev => {
            const exists = prev.find(f => f.id === sectionId);
            if (exists) return prev.map(f => f.id === sectionId ? newFile : f);
            return [...prev, newFile];
          });

          if (!activeFileId) setActiveFileId(sectionId);

          const sectionIdx = state.sections.findIndex(s => s.id === sectionId);
          setBuildSteps(prev => prev.map((s, i) => i === sectionIdx ? { ...s, status: 'done' } : i === sectionIdx + 1 && i < prev.length ? { ...s, status: 'active' } : s));
          const progress = ((sectionIdx + 1) / state.sections.length) * 100;
          setBuildProgress(progress);
          addConsole('success', `Built: ${section?.title || sectionId}`);

          const updatedSections = state.sections.map(s =>
            s.id === sectionId ? { ...s, status: 'complete' as const } : s
          );
          updateSections(updatedSections);

          // Build preview from generated code
          const doc = buildPreviewDocument({
            html: '', css: '', js: '', tsx: code, type: 'react',
            hasPreviewableContent: true, files: [{ name: `${sectionId}.tsx`, language: 'tsx', content: code }]
          });
          setPreviewContent(doc);
        }

        if (event.type === 'COMPLETE') {
          setProjectStage('refine');
          setIsBuilding(false);
          setBuildPhase('done');
          setBuildProgress(100);
          addConsole('success', 'Build complete! All components generated.');
          showToast('Build complete!', 'success');

          // Create a main App file that composes all sections
          const appContent = generateAppFile(state.sections);
          const appFile: WebDevFile = {
            id: 'app-main',
            name: 'App.tsx',
            path: 'src/App.tsx',
            language: 'typescript',
            content: appContent,
            type: 'page'
          };
          setFiles(prev => [...prev, appFile]);
        }
      }
    );
  };

  const generateAppFile = (sections: typeof state.sections): string => {
    const imports = sections.map(s => `import { ${s.title.replace(/\s+/g, '')} } from './components/${s.id}';`).join('\n');
    const components = sections.map(s => `<${s.title.replace(/\s+/g, '')} />`).join('\n        ');
    return `import React from 'react';
${imports}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      ${components}
    </div>
  );
}`;
  };

  // Extract code from messages
  useEffect(() => {
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      const extracted = extractPreviewableCode(lastMsg.content);
      if (extracted.files && extracted.files.length > 0) {
        const newFiles = extracted.files.map((f, idx) => ({
          id: `file-${Date.now()}-${idx}`,
          name: f.name,
          path: f.name.includes('/') ? f.name : `src/${f.name}`,
          language: f.language,
          content: f.content,
          type: f.name.endsWith('.css') ? 'style' : f.name.endsWith('.tsx') ? 'component' : 'config' as any
        }));
        setFiles(prev => {
          const merged = [...prev];
          newFiles.forEach(nf => {
            const exists = merged.find(f => f.name === nf.name);
            if (exists) exists.content = nf.content;
            else merged.push(nf);
          });
          return merged;
        });
        if (!activeFileId) setActiveFileId(newFiles[0]?.id || null);
      }
      if (extracted.hasPreviewableContent) {
        try {
          const doc = buildPreviewDocument(extracted);
          setPreviewContent(doc);
          setPreviewError(null);
        } catch (e: any) {
          setPreviewError(e.message);
        }
      }
    }
  }, [state.messages]);

  const handleCodeChange = (newCode: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
    if (activeFile?.name === 'index.html' || activeFile?.name === 'App.tsx') {
      try {
        const extracted = extractPreviewableCode(newCode);
        const doc = buildPreviewDocument(extracted);
        setPreviewContent(doc);
      } catch (e) { /* ignore */ }
    }
  };

  const handleExport = async () => {
    if (files.length === 0) {
      showToast('No code to export', 'error');
      return;
    }
    const codeToSave = files.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    if (state.currentChatId) {
      await updateChatCode(state.currentChatId, codeToSave);
    }
    // Also download as a single file
    const blob = new Blob([codeToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-project-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project exported!', 'success');
    addConsole('success', 'Project exported successfully');
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const getFileTree = () => {
    const tree: Array<{ type: 'folder' | 'file'; name: string; path: string; id?: string; children?: any[] }> = [];
    const components = files.filter(f => f.type === 'component');
    const pages = files.filter(f => f.type === 'page');
    const styles = files.filter(f => f.type === 'style');
    const configs = files.filter(f => f.type === 'config');

    if (components.length > 0) {
      tree.push({
        type: 'folder', name: 'components', path: 'src/components',
        children: components.map(f => ({ type: 'file' as const, name: f.name, path: f.path, id: f.id }))
      });
    }
    if (pages.length > 0) {
      tree.push({
        type: 'folder', name: 'pages', path: 'src/pages',
        children: pages.map(f => ({ type: 'file' as const, name: f.name, path: f.path, id: f.id }))
      });
    }
    if (styles.length > 0) {
      tree.push({
        type: 'folder', name: 'styles', path: 'src/styles',
        children: styles.map(f => ({ type: 'file' as const, name: f.name, path: f.path, id: f.id }))
      });
    }
    configs.forEach(f => {
      tree.push({ type: 'file', name: f.name, path: f.path, id: f.id });
    });

    return tree;
  };

  const deviceWidth = deviceMode === 'mobile' ? 'max-w-[375px]' : deviceMode === 'tablet' ? 'max-w-[768px]' : 'max-w-full';

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-12 border-b border-white/5 bg-[#0c0c0e] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/40 hover:text-white" />
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Nexus Studio</h1>
              <p className="text-[10px] text-white/30 mt-0.5">
                {isBuilding ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                    {buildPhase === 'planning' ? 'Planning...' : 'Building...'}
                  </span>
                ) : (
                  state.projectStage === 'intent' ? 'Ready to build' : 'Ready to refine'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            {[
              { id: 'code' as EditorView, icon: Code2, label: 'Code' },
              { id: 'preview' as EditorView, icon: Eye, label: 'Preview' },
              { id: 'split' as EditorView, icon: Layout, label: 'Split' },
              { id: 'blueprint' as EditorView, icon: Layers, label: 'Blueprint' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setEditorView(id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                  editorView === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Device Toggle (preview mode) */}
          {(editorView === 'preview' || editorView === 'split') && (
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              {[
                { id: 'desktop' as DeviceMode, icon: Monitor },
                { id: 'tablet' as DeviceMode, icon: Tablet },
                { id: 'mobile' as DeviceMode, icon: Smartphone },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDeviceMode(id)}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    deviceMode === id ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          <div className="h-5 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn("p-1.5 rounded-lg transition-colors", sidebarOpen ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-lg text-[11px] font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="border-r border-white/5 bg-[#0c0c0e] flex flex-col shrink-0"
            >
              <div className="flex-1 overflow-y-auto p-2">
                {/* File Tree */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                    <FolderTree className="w-3 h-3 text-white/30" />
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Explorer</h3>
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-6 text-white/20">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-[11px]">No files yet</p>
                      <p className="text-[10px] mt-1">Describe what to build</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {getFileTree().map((item, idx) => (
                        <FileTreeItem
                          key={idx}
                          item={item}
                          activeFileId={activeFileId}
                          expandedFolders={expandedFolders}
                          onToggleFolder={toggleFolder}
                          onSelectFile={(id) => { setActiveFileId(id); setEditorView('code'); }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sections */}
                {state.sections.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                      <Layers className="w-3 h-3 text-white/30" />
                      <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Sections</h3>
                    </div>
                    <div className="space-y-0.5">
                      {state.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => selectSection(section.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all text-xs",
                            state.selectedSectionId === section.id
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              : "text-white/40 hover:bg-white/5 hover:text-white/70"
                          )}
                        >
                          {section.status === 'complete' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                          ) : section.status === 'generating' ? (
                            <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                          ) : (
                            <Box className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate">{section.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Build Steps */}
                {buildSteps.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                      <GitBranch className="w-3 h-3 text-white/30" />
                      <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Pipeline</h3>
                    </div>
                    <div className="space-y-1">
                      {buildSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1">
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                            step.status === 'done' ? "bg-green-500/20" :
                              step.status === 'active' ? "bg-indigo-500/20" :
                                step.status === 'error' ? "bg-red-500/20" : "bg-white/5"
                          )}>
                            {step.status === 'done' ? <Check className="w-2.5 h-2.5 text-green-400" /> :
                              step.status === 'active' ? <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" /> :
                                step.status === 'error' ? <AlertCircle className="w-2.5 h-2.5 text-red-400" /> :
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                          </div>
                          <span className={cn(
                            "text-[10px]",
                            step.status === 'done' ? "text-green-400/70" :
                              step.status === 'active' ? "text-indigo-300" :
                                step.status === 'error' ? "text-red-400/70" : "text-white/20"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {isBuilding && (
                      <div className="mt-2 px-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-white/30">Progress</span>
                          <span className="text-[10px] text-white/40">{Math.round(buildProgress)}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${buildProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {state.projectStage === 'refine' && !isBuilding && (
                <div className="p-2 border-t border-white/5 space-y-1">
                  <p className="text-[10px] text-white/30 px-2 mb-1 font-medium uppercase tracking-wider">Quick Actions</p>
                  {[
                    { icon: Sparkles, label: 'Polish UI', action: () => handleSubmit('Make the UI more polished and premium looking') },
                    { icon: Smartphone, label: 'Make Responsive', action: () => handleSubmit('Make all components fully responsive for mobile') },
                    { icon: ZapIcon, label: 'Add Animations', action: () => handleSubmit('Add smooth framer-motion animations to all sections') },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor / Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            {(editorView === 'code' || editorView === 'split') && (
              <div className={cn("flex flex-col", editorView === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full')}>
                {activeFile ? (
                  <>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/5">
                      <div className="flex items-center gap-2 text-[11px] text-white/40">
                        <FileCode className="w-3 h-3" />
                        <span>{activeFile.path}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeFile.content);
                            showToast('Copied to clipboard', 'success');
                          }}
                          className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={activeFile.content}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      className="flex-1 w-full bg-transparent p-4 font-mono text-[13px] text-white/80 resize-none focus:outline-none leading-relaxed custom-scrollbar"
                      spellCheck={false}
                      style={{ tabSize: 2 }}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Code2 className="w-12 h-12 mx-auto mb-3 text-white/10" />
                      <p className="text-sm text-white/30">Select a file to edit</p>
                      <p className="text-xs text-white/20 mt-1">Or describe what to build below</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {(editorView === 'preview' || editorView === 'split') && (
              <div className={cn("flex flex-col bg-[#0a0a0b]", editorView === 'split' ? 'w-1/2' : 'w-full')}>
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <Eye className="w-3 h-3" />
                    <span>Live Preview</span>
                  </div>
                  <button
                    onClick={() => {
                      if (activeFile) {
                        const extracted = extractPreviewableCode(activeFile.content);
                        const doc = buildPreviewDocument(extracted);
                        setPreviewContent(doc);
                      }
                    }}
                    className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto flex items-start justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')]">
                  <div className={cn("w-full h-[calc(100%-1rem)] bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300", deviceWidth)}>
                    {previewContent ? (
                      <iframe
                        srcDoc={previewContent}
                        className="w-full h-full"
                        sandbox="allow-scripts allow-same-origin allow-modals"
                        title="Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <div className="text-center">
                          <Monitor className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-xs">No preview available</p>
                          <p className="text-[10px] mt-1 opacity-50">Generate code to see preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Blueprint View */}
            {editorView === 'blueprint' && (
              <div className="w-full flex flex-col overflow-auto bg-[#09090b]">
                <div className="p-6 max-w-4xl mx-auto w-full">
                  {!state.siteIntent ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Layers className="w-12 h-12 mx-auto mb-3 text-white/10" />
                        <p className="text-sm text-white/30">No blueprint yet</p>
                        <p className="text-xs text-white/20 mt-1">Start a build to generate the blueprint</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Intent */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-sm font-semibold text-white">Project Intent</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Goal</p>
                            <p className="text-xs text-white/70">{(state.siteIntent as any)?.goal || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Audience</p>
                            <p className="text-xs text-white/70">{(state.siteIntent as any)?.audience || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Site Type</p>
                            <p className="text-xs text-white/70">{(state.siteIntent as any)?.site_type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Tone</p>
                            <p className="text-xs text-white/70">{(state.siteIntent as any)?.tone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Architecture */}
                      {state.siteArchitecture && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Box className="w-4 h-4 text-violet-400" />
                            <h3 className="text-sm font-semibold text-white">Architecture</h3>
                          </div>
                          <div className="space-y-2">
                            {(state.siteArchitecture as any)?.sections?.map((s: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                                <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-400 font-medium">{i + 1}</div>
                                <div>
                                  <p className="text-xs text-white/70 font-medium">{s.name}</p>
                                  <p className="text-[10px] text-white/30">{s.purpose}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Design System */}
                      {state.designSystem && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-white">Design System</h3>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries((state.designSystem as any)?.color_palette || {}).map(([name, value]: [string, any]) => (
                              <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: value }} />
                                <span className="text-[10px] text-white/50 capitalize">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel - Terminal */}
          <AnimatePresence>
            {bottomPanel !== 'none' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 160 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15 }}
                className="border-t border-white/5 bg-[#0c0c0e] flex flex-col shrink-0"
              >
                <div className="flex items-center justify-between px-3 py-1 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Console</span>
                    <span className="text-[10px] text-white/20">({consoleMessages.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConsoleMessages([])}
                      className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white/50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setBottomPanel('none')}
                      className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white/50 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5 custom-scrollbar">
                  {consoleMessages.length === 0 ? (
                    <p className="text-white/15">Console output will appear here...</p>
                  ) : (
                    consoleMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2">
                        <span className="text-white/15 shrink-0">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className={cn(
                          msg.type === 'error' ? 'text-red-400' :
                            msg.type === 'success' ? 'text-green-400' :
                              msg.type === 'warn' ? 'text-yellow-400' :
                                msg.type === 'system' ? 'text-indigo-400' :
                                  'text-white/50'
                        )}>
                          {msg.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Command Bar */}
      <div className="border-t border-white/5 bg-[#0c0c0e] p-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "flex items-end gap-2 bg-white/[0.03] rounded-xl border p-2 transition-all",
            isSubmitting || isBuilding ? "border-indigo-500/30" : "border-white/5 focus-within:border-white/10"
          )}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isSubmitting || isBuilding}
              placeholder={
                isBuilding ? 'Building in progress...' :
                  state.projectStage === 'intent' ? 'Describe what you want to build...' :
                    'Ask for changes or refinements...'
              }
              className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-white placeholder:text-white/20 min-h-[36px] max-h-24 disabled:opacity-50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && !isBuilding) {
                  e.preventDefault();
                  if (inputValue.trim()) handleSubmit(inputValue.trim());
                }
              }}
            />
            <button
              onClick={() => { if (inputValue.trim() && !isSubmitting && !isBuilding) handleSubmit(inputValue.trim()); }}
              disabled={isSubmitting || isBuilding || !inputValue.trim()}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0",
                isSubmitting || isBuilding ? "bg-indigo-500/20 text-indigo-400" :
                  inputValue.trim() ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20" :
                    "bg-white/5 text-white/20"
              )}
            >
              {isSubmitting || isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className={cn(
              "text-[10px] flex items-center gap-1",
              isBuilding ? "text-indigo-400" : "text-white/20"
            )}>
              {isBuilding ? (
                <><Loader2 className="w-2.5 h-2.5 animate-spin" /> {buildPhase === 'planning' ? 'Planning' : 'Building'} — {Math.round(buildProgress)}%</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ready</>
              )}
            </span>
            <button
              onClick={() => setBottomPanel(bottomPanel === 'none' ? 'terminal' : 'none')}
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-1"
            >
              <Terminal className="w-2.5 h-2.5" />
              {bottomPanel === 'none' ? 'Show Console' : 'Hide Console'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// File Tree Item Component
function FileTreeItem({ item, activeFileId, expandedFolders, onToggleFolder, onSelectFile }: {
  item: { type: 'folder' | 'file'; name: string; path: string; id?: string; children?: any[] };
  activeFileId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (name: string) => void;
  onSelectFile: (id: string) => void;
}) {
  const isExpanded = expandedFolders.has(item.name);

  if (item.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(item.name)}
          className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400/60" />
          <span>{item.name}</span>
        </button>
        <AnimatePresence>
          {isExpanded && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="ml-4 border-l border-white/5 pl-2 space-y-0.5 overflow-hidden"
            >
              {item.children.map((child: any, idx: number) => (
                <FileTreeItem
                  key={idx}
                  item={child}
                  activeFileId={activeFileId}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => item.id && onSelectFile(item.id)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-all text-xs",
        activeFileId === item.id
          ? "bg-white/10 text-white"
          : "text-white/40 hover:bg-white/5 hover:text-white/70"
      )}
    >
      <FileCode className="w-3 h-3 text-blue-400/60" />
      <span className="truncate">{item.name}</span>
    </button>
  );
}
