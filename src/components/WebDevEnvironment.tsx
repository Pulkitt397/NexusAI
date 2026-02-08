import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context';
import { runPlanningPhase, runBuildPhase, PipelineEvent } from '@/ai/pipeline';
import { extractPreviewableCode, buildPreviewDocument } from '@/utils/codeDetection';
import { cn } from '@/lib/utils';
import { 
  FileCode, 
  Play, 
  Layout, 
  Settings, 
  Download, 
  PanelLeft,
  X,
  CheckCircle2,
  Loader2,
  Code2,
  Eye,
  Maximize2,
  Minimize2,
  ChevronRight,
  FolderOpen,
  Zap
} from 'lucide-react';
interface WebDevFile {
  id: string;
  name: string;
  language: string;
  content: string;
  type: 'component' | 'style' | 'asset' | 'config';
}

interface WebDevEnvironmentProps {
  onClose: () => void;
}

export function WebDevEnvironment({ onClose }: WebDevEnvironmentProps) {
  const { state, sendMessage, showToast, setProjectStage, updateSections, selectSection, setBuilderState, updateChatCode } = useApp();
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // File state
  const [files, setFiles] = useState<WebDevFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  
  // Build state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  
  const activeFile = files.find(f => f.id === activeFileId);
  
  // Handle new prompt
  const handleSubmit = async (content: string) => {
    if (state.projectStage === 'intent') {
      await startBuildPipeline(content);
    } else {
      await sendMessage(content);
    }
  };
  
  // Pipeline: Planning Phase
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
    setBuildProgress(10);
    
    await runPlanningPhase(prompt, state.currentProviderId, apiKey, state.currentModelId, (event: PipelineEvent) => {
      switch (event.type) {
        case 'INTENT_GENERATED':
          setBuilderState({ siteIntent: event.payload });
          setBuildProgress(25);
          break;
        case 'ARCHITECTURE_GENERATED':
          setBuilderState({ siteArchitecture: event.payload });
          const sections = event.payload.sections.map((s: any, idx: number) => ({
            id: s.id,
            title: s.name,
            description: s.purpose,
            status: 'pending' as const,
            order: idx
          }));
          updateSections(sections);
          setBuildProgress(40);
          break;
        case 'DESIGN_GENERATED':
          setBuilderState({ designSystem: event.payload });
          setBuildProgress(60);
          break;
        case 'ASSET_GENERATED':
          setBuilderState({ assetPlan: event.payload });
          setBuildProgress(80);
          break;
        case 'COMPLETE':
          setBuildProgress(100);
          setTimeout(() => startBuildPhase(), 500);
          break;
        case 'ERROR':
          showToast(event.payload, 'error');
          setIsBuilding(false);
          break;
      }
    });
  };
  
  // Pipeline: Build Phase
  const startBuildPhase = async () => {
    const providerId = state.currentProviderId || 'google';
    const apiKey = state.apiKeys[providerId] || '';
    
    setProjectStage('build');
    setBuildProgress(0);
    
    await runBuildPhase(
      state.sections.map(s => ({ id: s.id, purpose: s.description })),
      state.designSystem || {} as any,
      state.assetPlan || { section_assets: [] } as any,
      providerId,
      apiKey,
      state.currentModelId || '',
      (event: PipelineEvent) => {
        if (event.type === 'COMPONENT_GENERATED') {
          const { sectionId, code } = event.payload;
          
          const newFile: WebDevFile = {
            id: sectionId,
            name: `${sectionId}.tsx`,
            language: 'typescript',
            content: code,
            type: 'component'
          };
          
          setFiles(prev => {
            const exists = prev.find(f => f.id === sectionId);
            if (exists) {
              return prev.map(f => f.id === sectionId ? newFile : f);
            }
            return [...prev, newFile];
          });
          
          if (!activeFileId) {
            setActiveFileId(sectionId);
          }
          
          // Update progress
          const completed = files.filter(f => f.type === 'component').length + 1;
          const total = state.sections.length;
          setBuildProgress((completed / total) * 100);
          
          // Update section status
          const updatedSections = state.sections.map(s =>
            s.id === sectionId ? { ...s, status: 'complete' as const } : s
          );
          updateSections(updatedSections);
        }
        
        if (event.type === 'COMPLETE') {
          setProjectStage('refine');
          setIsBuilding(false);
          setBuildProgress(100);
          showToast('Build complete!', 'success');
        }
      }
    );
  };
  
  // Extract code from messages
  useEffect(() => {
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      const extracted = extractPreviewableCode(lastMsg.content);
      
      if (extracted.files && extracted.files.length > 0) {
        const newFiles = extracted.files.map((f, idx) => ({
          id: `file-${idx}`,
          name: f.name,
          language: f.language,
          content: f.content,
          type: f.name.endsWith('.css') ? 'style' : f.name.endsWith('.tsx') ? 'component' : 'config' as any
        }));
        
        setFiles(prev => {
          const merged = [...prev];
          newFiles.forEach(nf => {
            const exists = merged.find(f => f.name === nf.name);
            if (exists) {
              exists.content = nf.content;
            } else {
              merged.push(nf);
            }
          });
          return merged;
        });
        
        if (!activeFileId) {
          setActiveFileId(newFiles[0]?.id || null);
        }
      }
      
      if (extracted.hasPreviewableContent) {
        const doc = buildPreviewDocument(extracted);
        setPreviewContent(doc);
      }
    }
  }, [state.messages]);
  
  // Handle code edits
  const handleCodeChange = (newCode: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, content: newCode } : f
    ));
    if (activeFile?.name === 'index.html') {
      setPreviewContent(newCode);
    }
  };
  
  // Export project
  const handleExport = async () => {
    if (!state.currentChatId || files.length === 0) {
      showToast('No code to export', 'error');
      return;
    }
    
    const codeToSave = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
    await updateChatCode(state.currentChatId, codeToSave);
    showToast('Project saved!', 'success');
  };
  
  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'style': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'asset': return <FolderOpen className="w-4 h-4 text-green-400" />;
      default: return <FileCode className="w-4 h-4 text-slate-400" />;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 h-14 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="h-6 w-px bg-slate-800" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Web Studio</h1>
              <p className="text-xs text-slate-500">
                {state.projectStage === 'intent' ? 'Ready to build' : 
                 state.projectStage === 'architecture' ? 'Planning...' :
                 state.projectStage === 'build' ? 'Building...' : 'Ready to edit'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                activeTab === 'editor' 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                activeTab === 'preview' 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-800 mx-2" />
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              sidebarOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors hidden lg:flex",
              previewOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Layout className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-slate-800/50 bg-slate-950/50 backdrop-blur flex flex-col"
            >
              {/* Sections */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                    Project Sections
                  </h3>
                  
                  {state.sections.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No sections yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {state.sections.map((section, idx) => (
                        <button
                          key={section.id}
                          onClick={() => selectSection(section.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                            state.selectedSectionId === section.id
                              ? "bg-indigo-500/10 border border-indigo-500/20"
                              : "hover:bg-slate-800/50 border border-transparent"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium",
                            section.status === 'complete' 
                              ? "bg-green-500/20 text-green-400" 
                              : section.status === 'generating'
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-slate-800 text-slate-500"
                          )}>
                            {section.status === 'complete' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              state.selectedSectionId === section.id ? "text-white" : "text-slate-300"
                            )}>
                              {section.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{section.description}</p>
                          </div>
                          {section.status === 'generating' && (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Files */}
                {files.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                      Files
                    </h3>
                    <div className="space-y-0.5">
                      {files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => setActiveFileId(file.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-sm",
                            activeFileId === file.id
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          )}
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Build Progress */}
              {isBuilding && (
                <div className="p-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Building...</span>
                    <span className="text-xs text-slate-500">{Math.round(buildProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${buildProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
              
              {/* New Section Button */}
              <div className="p-3 border-t border-slate-800/50">
                <button 
                  onClick={() => startBuildPhase()}
                  disabled={isBuilding || state.sections.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Build All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          {files.length > 0 && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/50 bg-slate-950/30 overflow-x-auto">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                    activeFileId === file.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  {getFileIcon(file.type)}
                  {file.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className={cn(
              "flex-1 flex flex-col transition-all duration-300",
              !previewOpen && "w-full"
            )}>
              {activeFile ? (
                <div className="flex-1 flex flex-col bg-slate-900/30">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/30 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{activeFile.name}</span>
                      <span className="text-slate-600">•</span>
                      <span>{activeFile.language}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={activeFile.content}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="flex-1 w-full bg-transparent p-4 font-mono text-sm text-slate-300 resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <Code2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Select a file to start editing</p>
                    <p className="text-xs mt-1 opacity-50">Or type a prompt to generate code</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview Panel */}
            <AnimatePresence>
              {previewOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '50%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-slate-800/50 bg-slate-950/30 flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/30 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors">
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-2xl">
                      {previewContent ? (
                        <iframe
                          srcDoc={previewContent}
                          className="w-full h-full"
                          sandbox="allow-scripts allow-same-origin"
                          title="Preview"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <div className="text-center">
                            <Layout className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">No preview available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Footer / Command Bar */}
      <div className="relative z-10 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 bg-slate-900/50 rounded-xl border border-slate-800 p-3">
            <textarea
              placeholder={state.projectStage === 'intent' 
                ? "Describe what you want to build..." 
                : "Ask for changes or improvements..."}
              className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-slate-200 placeholder:text-slate-500 min-h-[44px] max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  if (target.value.trim()) {
                    handleSubmit(target.value.trim());
                    target.value = '';
                  }
                }
              }}
            />
            <button
              onClick={(e) => {
                const textarea = (e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement);
                if (textarea?.value.trim()) {
                  handleSubmit(textarea.value.trim());
                  textarea.value = '';
                }
              }}
              className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Ready
            </span>
            <span>Press Enter to send</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
