import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api/nvidia': {
                target: 'https://integrate.api.nvidia.com/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
                secure: false
            },
            '/api/ollama': {
                target: 'https://ollama.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
                secure: false
            },
            '/api/gemini': {
                target: 'https://generativelanguage.googleapis.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
                secure: false
            },
            '/api/groq': {
                target: 'https://api.groq.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/groq/, ''),
                secure: false
            },
            '/api/openrouter': {
                target: 'https://openrouter.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
                secure: false
            },
            '/api/huggingface': {
                target: 'https://api-inference.huggingface.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/huggingface/, ''),
                secure: false
            },
            '/api/huggingface-api': {
                target: 'https://huggingface.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/huggingface-api/, ''),
                secure: false
            },
            '/api/zai': {
                target: 'https://api.z.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/zai/, ''),
                secure: false
            },
            '/api/search': {
                target: 'https://searx.be',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/search/, ''),
                secure: false
            }
        }
    },
})
