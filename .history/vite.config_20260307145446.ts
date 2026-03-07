import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/', // Force absolute asset paths
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        // Points to root; ensure your imports reflect this
        '@': path.resolve(__dirname, './') 
      }
    },
    build: {
      outDir: 'dist', // Explicitly tell Vite where to build
    },
    server: {
      port: 5174
    }
  }
})