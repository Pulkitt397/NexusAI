import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Loader2, Check, X } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

export function AuthPage() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
    const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

    const [particles] = useState<Particle[]>(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 10,
        }))
    );

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
        if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
        if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' };
        return { score, label: 'Excellent', color: 'bg-emerald-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    const validateForm = (): string | null => {
        if (mode === 'register' && !name.trim()) return 'Name is required';
        if (!email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        if (mode === 'register' && password !== confirmPassword) return 'Passwords do not match';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
            }
        } catch (err: any) {
            console.error(err);
            const message = err.code === 'auth/invalid-credential'
                ? 'Invalid email or password'
                : err.code === 'auth/email-already-in-use'
                    ? 'Email already registered'
                    : err.code === 'auth/weak-password'
                        ? 'Password is too weak'
                        : err.message || 'Something went wrong';
            setError(message);
        } finally {
            setIsLoading(false);
        }
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

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setError(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
    };

    return (
        <div className="min-h-screen w-screen bg-[#09090b] relative overflow-hidden flex items-center justify-center">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#09090b] to-purple-950/80" />

            {/* Animated mesh gradients */}
            <motion.div
                className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]"
                animate={{
                    x: [0, -80, 0],
                    y: [0, -60, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[100px]"
                animate={{
                    x: [0, 60, -40, 0],
                    y: [0, -40, 60, 0],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-white/20"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0, 0.6, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Noise texture */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }}
            />

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 px-4"
                style={{ perspective: 1500 }}
            >
                {/* Logo and title */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 mb-4 relative overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                        Nexus AI
                    </h1>
                    <p className="text-white/40 mt-2 text-sm">
                        {mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="relative"
                    style={{ rotateX, rotateY }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Card border glow */}
                    <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-[2px] w-[40%] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                            animate={{ left: ["-40%", "100%"] }}
                            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-0 right-0 h-[2px] w-[40%] bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                            animate={{ right: ["-40%", "100%"] }}
                            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: 1.5 }}
                        />
                    </div>

                    <div className="relative bg-[#0c0c0e]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06] shadow-2xl shadow-indigo-500/5">
                        {/* Mode toggle */}
                        <div className="flex bg-white/5 rounded-xl p-1 mb-6 relative">
                            <motion.div
                                className="absolute top-1 bottom-1 bg-white/10 rounded-lg"
                                style={{
                                    left: mode === 'login' ? '4px' : 'calc(50% + 2px)',
                                    width: 'calc(50% - 6px)',
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                            <button
                                onClick={() => switchMode('login')}
                                className={cn(
                                    "flex-1 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors",
                                    mode === 'login' ? "text-white" : "text-white/40 hover:text-white/60"
                                )}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => switchMode('register')}
                                className={cn(
                                    "flex-1 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors",
                                    mode === 'register' ? "text-white" : "text-white/40 hover:text-white/60"
                                )}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Error message */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2"
                                >
                                    <X className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mode}
                                    initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Name field (register only) */}
                                    <AnimatePresence>
                                        {mode === 'register' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mb-4"
                                            >
                                                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                                                    Name
                                                </label>
                                                <div className="relative">
                                                    <User className={cn(
                                                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                                        focusedField === 'name' ? "text-indigo-400" : "text-white/20"
                                                    )} />
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        onFocus={() => setFocusedField('name')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="Enter your name"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Email field */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className={cn(
                                                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                                focusedField === 'email' ? "text-indigo-400" : "text-white/20"
                                            )} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="Enter your email"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password field */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className={cn(
                                                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                                focusedField === 'password' ? "text-indigo-400" : "text-white/20"
                                            )} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setFocusedField('password')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="Enter your password"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Password strength indicator (register only) */}
                                        <AnimatePresence>
                                            {mode === 'register' && password && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-2"
                                                >
                                                    <div className="flex gap-1 mb-1">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    "h-1 flex-1 rounded-full transition-all duration-300",
                                                                    i <= passwordStrength.score ? passwordStrength.color : "bg-white/10"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className={cn(
                                                        "text-xs",
                                                        passwordStrength.score <= 1 ? "text-red-400" :
                                                            passwordStrength.score <= 2 ? "text-orange-400" :
                                                                passwordStrength.score <= 3 ? "text-yellow-400" :
                                                                    passwordStrength.score <= 4 ? "text-green-400" :
                                                                        "text-emerald-400"
                                                    )}>
                                                        {passwordStrength.label}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Confirm password field (register only) */}
                                    <AnimatePresence>
                                        {mode === 'register' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mb-4"
                                            >
                                                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className={cn(
                                                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                                        focusedField === 'confirmPassword' ? "text-indigo-400" : "text-white/20"
                                                    )} />
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        onFocus={() => setFocusedField('confirmPassword')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="Confirm your password"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    {confirmPassword && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute right-10 top-1/2 -translate-y-1/2"
                                                        >
                                                            {confirmPassword === password ? (
                                                                <Check className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <X className="w-4 h-4 text-red-400" />
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>

                            {/* Submit button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25",
                                    isLoading && "opacity-70 cursor-wait"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="text"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-white/30 font-medium">or continue with</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Google button */}
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className={cn(
                                "w-full relative overflow-hidden bg-white text-black font-medium py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3",
                                isLoading && "opacity-70 cursor-wait"
                            )}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm font-semibold">Continue with Google</span>
                        </motion.button>

                        {/* Footer */}
                        <p className="text-center text-xs text-white/25 mt-6">
                            {mode === 'login' ? (
                                <>
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => switchMode('register')}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button
                                        onClick={() => switchMode('login')}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
