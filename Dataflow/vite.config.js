import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'recharts',
              test: /node_modules[\\/]recharts[\\/]/,
              priority: 10,
            },
            {
              name: 'xyflow',
              test: /node_modules[\\/]@xyflow[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
