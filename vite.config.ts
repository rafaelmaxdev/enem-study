import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
export default defineConfig(({mode})=>({
 base:mode==='pages'?'/enem-study/':'/',
 plugins:[react(),tailwindcss()],
 resolve:mode==='pages'?{alias:{'./starting-progress':fileURLToPath(new URL('./src/starting-progress.pages.ts',import.meta.url))}}:undefined,
 build:{outDir:mode==='pages'?'dist-pages':'dist',chunkSizeWarningLimit:1800},server:{host:'127.0.0.1'}
}));
