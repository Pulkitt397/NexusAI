// Settings Modal - API Key Management
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, Check } from 'lucide-react';
import { useApp } from '@/context';
import { cn } from '@/lib/utils';
import * as api from '@/api';
import { PROVIDER_LINKS } from '@/constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { state, setApiKey, selectProvider, showToast } = useApp();
    const [selectedProvider, setSelectedProvider] = useState(state.currentProviderId || 'gemini');
    const [keyValue, setKeyValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Sync selected provider when modal opens or state changes
    React.useEffect(() => {
        if (state.currentProviderId) {
            setSelectedProvider(state.currentProviderId);
        }
    }, [state.currentProviderId, isOpen]);

    const handleSave = async () => {
        if (!keyValue.trim()) return;

        setIsLoading(true);
        try {
            // Test the API key by fetching models
            const models = await api.fetchModels(selectedProvider, keyValue);
            setApiKey(selectedProvider, keyValue);
            await selectProvider(selectedProvider);
            showToast('API key saved successfully!', 'success');
            setKeyValue('');
            onClose();
        } catch (err) {
            showToast('Invalid API key', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Merge provider info with links
    const providers = React.useMemo(() => {
        return state.providers.map(p => ({
            ...p,
            link: PROVIDER_LINKS[p.id] || '#'
        }));
    }, [state.providers]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-md mx-4 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-violet-400" />
                            <h2 className="text-lg font-semibold text-white">Settings</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/40 hover:text-white/80 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Provider tabs */}
                        <div className="flex gap-2">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProvider(p.id)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                        selectedProvider === p.id
                                            ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
                                    )}
                                >
                                    <span>{p.icon}</span>
                                    <span className="hidden sm:inline">{p.name}</span>
                                    {state.apiKeys[p.id] && (
                                        <Check className="w-3 h-3 text-green-400" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* API Key input */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60">API Key</label>
                            <input
                                type="password"
                                value={keyValue}
                                onChange={(e) => setKeyValue(e.target.value)}
                                placeholder={state.apiKeys[selectedProvider] ? '••••••••••••••••' : 'Enter your API key'}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            />
                            <p className="text-xs text-white/40 flex items-center gap-1">
                                Get your key from{' '}
                                <a
                                    href={providers.find(p => p.id === selectedProvider)?.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-violet-400 hover:underline inline-flex items-center gap-1"
                                >
                                    {providers.find(p => p.id === selectedProvider)?.name}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!keyValue.trim() || isLoading}
                                className={cn(
                                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    keyValue.trim() && !isLoading
                                        ? "bg-violet-500 hover:bg-violet-600 text-white"
                                        : "bg-white/10 text-white/40 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? 'Verifying...' : 'Save Key'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
