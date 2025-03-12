import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ Fixes incorrect asset paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});

