import React from 'react';
import { motion } from 'framer-motion';

export function WorkspaceBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Animated Perspective Grid */}
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black)]">
                <motion.div
                    animate={{
                        y: [0, -40, 0],
                        rotateX: [60, 55, 60]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: 'perspective(1000px) rotateX(60deg) scale(2.5)',
                        transformOrigin: 'top'
                    }}
                />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * -100 - 50 + "px"],
                            opacity: [null, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 20,
                            ease: "linear"
                        }}
                        className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
                    />
                ))}
            </div>

            {/* Premium Aurora Gradients */}
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    x: [0, 80, 0],
                    y: [0, -40, 0],
                    rotate: [0, 20, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[130px] rounded-full"
            />

            <motion.div
                animate={{
                    scale: [1.3, 1, 1.3],
                    x: [0, -60, 0],
                    y: [0, 80, 0],
                    rotate: [0, -25, 0],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/10 blur-[130px] rounded-full"
            />

            {/* Textured Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-none"
                style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

            {/* Central Depth Fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none" />
        </div>
    );
}
