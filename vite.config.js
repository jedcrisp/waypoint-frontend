import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import WindiCSS from "vite-plugin-windicss";

export default defineConfig({
  plugins: [react(), WindiCSS()], // Include WindiCSS
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist", // ✅ Vercel looks for this folder after build
    rollupOptions: {
      input: "./index.html", // ✅ Ensure Vite finds index.html
    },
  },
  server: {
    port: 5173, // ✅ Set local dev port
    open: true, // ✅ Open browser on start
  },
});