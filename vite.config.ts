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
                secure: false,
                headers: {
                    'Origin': 'https://integrate.api.nvidia.com'
                }
            }
        }
    },
})
