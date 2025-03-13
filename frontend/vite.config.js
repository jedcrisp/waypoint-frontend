import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".", // ✅ Ensure Vite looks in the correct directory
  build: {
    outDir: "dist", // ✅ Ensures built files go to the correct location
    rollupOptions: {
      input: "index.html", // ✅ Ensures Vite uses index.html as the entry file
    },
  },
});
