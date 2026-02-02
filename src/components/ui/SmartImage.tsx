import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { resolveImageSearch } from '@/services/imageService';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt?: string;
}

export const SmartImage = React.memo(({ src, alt, className, ...props }: SmartImageProps) => {
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    // Check for "search:" protocol or local asset proxy
    const isSearch = src?.startsWith('search:') || src?.startsWith('https://nexus-asset.local/image/');

    useEffect(() => {
        if (!src) return;

        if (isSearch) {
            setIsLoading(true);
            resolveImageSearch(src)
                .then(result => {
                    setResolvedSrc(result.url);
                    setIsLoading(false);
                })
                .catch(() => {
                    setError(true);
                    setIsLoading(false);
                });
        } else {
            setResolvedSrc(src);
        }
    }, [src, isSearch]);

    if (!src) return null;

    // Normal images (not search protocol) - render directly but with fade in
    if (!isSearch) {
        return (
            <img
                src={src}
                alt={alt}
                className={`rounded-lg max-w-full h-auto my-4 border border-white/5 ${className}`}
                loading="lazy"
                {...props}
            />
        );
    }

    // Filter out props that might conflict with framer-motion or are unnecessary
    const { onDrag, ...safeProps } = props as any;

    return (
        <div className="relative my-4 rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 min-h-[200px] flex items-center justify-center group">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skeleton-shimmer" />

                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                        <span className="text-xs font-medium tracking-wide">Fetching asset...</span>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-2 text-red-400/80 p-6"
                    >
                        <ImageIcon className="w-8 h-8 opacity-50" />
                        <span className="text-sm">Failed to load asset</span>
                    </motion.div>
                ) : (
                    <motion.img
                        key="image"
                        src={resolvedSrc!}
                        alt={alt}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`w-full h-auto object-cover rounded-xl ${className}`}
                        {...safeProps}
                    />
                )}
            </AnimatePresence>

            {/* Caption Overlay on Hover */}
            {!isLoading && !error && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-white/90 truncate font-medium">{alt}</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">AI Generated Asset</p>
                </div>
            )}
        </div>
    );
});
