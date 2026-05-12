import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // default Vite dev server port
    open: true, // automatically open in browser
  },
  build: {
    outDir: "dist",      // output folder for production build
    sourcemap: true,     // optional: generates source maps
    rollupOptions: {
      output: {
        manualChunks: undefined, // optional: keep single bundle if desired
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src", // allows imports like "@/components/Quiz"
    },
  },
});
