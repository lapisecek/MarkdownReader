import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Important for electron file:// protocol
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('mermaid') || id.includes('elkjs') || id.includes('cytoscape') || id.includes('d3')) {
              return 'vendor-mermaid';
            }
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror') || id.includes('tiptap-markdown')) {
              return 'vendor-tiptap';
            }
            if (id.includes('lowlight') || id.includes('highlight.js')) {
              return 'vendor-highlight';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
          }
        },
      },
    },
  },
})
