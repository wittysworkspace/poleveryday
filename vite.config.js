import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // เช็คบรรทัดนี้

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/poleveryday/',
  css: {
    transformer: 'postcss', // เพิ่มบรรทัดนี้เพื่อลดปัญหา Error @theme
  },
})