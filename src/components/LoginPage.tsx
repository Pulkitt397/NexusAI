import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // For 3D card effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to sign in');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
            {/* Background gradient effect - purple style */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/40 via-purple-700/50 to-black" />

            {/* Subtle noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                }}
            />

            {/* Top radial glow */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-purple-400/20 blur-[80px]" />
            <motion.div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-purple-300/20 blur-[60px]"
                animate={{
                    opacity: [0.15, 0.3, 0.15],
                    scale: [0.98, 1.02, 0.98]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "mirror"
                }}
            />
            <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-purple-400/20 blur-[60px]"
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1
                }}
            />

            {/* Animated glow spots */}
            <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" />
            <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" style={{ animationDelay: '1s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm relative z-10 px-4"
                style={{ perspective: 1500 }}
            >
                <motion.div
                    className="relative"
                    style={{ rotateX, rotateY }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    whileHover={{ z: 10 }}
                >
                    <div className="relative group">
                        {/* Card glow effect */}
                        <motion.div
                            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                            animate={{
                                boxShadow: [
                                    "0 0 10px 2px rgba(255,255,255,0.03)",
                                    "0 0 15px 5px rgba(255,255,255,0.05)",
                                    "0 0 10px 2px rgba(255,255,255,0.03)"
                                ],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatType: "mirror"
                            }}
                        />

                        {/* Traveling light beam effect */}
                        <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                            {/* Top light beam */}
                            <motion.div
                                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    left: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                                    filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror" }
                                }}
                            />

                            {/* Right light beam */}
                            <motion.div
                                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    top: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 },
                                    filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 0.6 }
                                }}
                            />

                            {/* Bottom light beam */}
                            <motion.div
                                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    right: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 },
                                    filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 1.2 }
                                }}
                            />

                            {/* Left light beam */}
                            <motion.div
                                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                                initial={{ filter: "blur(2px)" }}
                                animate={{
                                    bottom: ["-50%", "100%"],
                                    opacity: [0.3, 0.7, 0.3],
                                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                                }}
                                transition={{
                                    bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                                    opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 },
                                    filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 1.8 }
                                }}
                            />

                            {/* Corner glow spots */}
                            <motion.div
                                className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                            />
                            <motion.div
                                className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
                            />
                            <motion.div
                                className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", delay: 1 }}
                            />
                            <motion.div
                                className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2.3, repeat: Infinity, repeatType: "mirror", delay: 1.5 }}
                            />
                        </div>

                        {/* Card border glow */}
                        <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

                        {/* Glass card background */}
                        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
                            {/* Subtle card inner patterns */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                                    backgroundSize: '30px 30px'
                                }}
                            />

                            {/* Logo and header */}
                            <div className="text-center space-y-1 mb-6">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", duration: 0.8 }}
                                    className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                                >
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">✦</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                                >
                                    Welcome to Nexus AI
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-white/50 text-sm"
                                >
                                    Sign in to sync your chats across devices
                                </motion.p>
                            </div>

                            {/* Error message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Google Sign In Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full relative group/google"
                            >
                                <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/google:opacity-70 transition-opacity duration-300" />

                                <div className={cn(
                                    "relative overflow-hidden bg-white text-black font-medium h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-3",
                                    isLoading && "opacity-70 cursor-wait"
                                )}>
                                    {/* Button background animation */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                                        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                                    />

                                    <AnimatePresence mode="wait">
                                        {isLoading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center justify-center"
                                            >
                                                <div className="w-5 h-5 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                                            </motion.div>
                                        ) : (
                                            <motion.span
                                                key="button-text"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center justify-center gap-3 text-sm font-semibold"
                                            >
                                                {/* Google Icon */}
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Continue with Google
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.button>

                            {/* Footer */}
                            <motion.p
                                className="text-center text-xs text-white/30 mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                By continuing, you agree to our Terms of Service.
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
