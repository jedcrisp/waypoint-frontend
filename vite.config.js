import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import WindiCSS from "vite-plugin-windicss";

export default defineConfig({
  plugins: [react(), WindiCSS()],
  root: ".", // Ensures Vite looks in the correct directory
  build: {
    outDir: "dist", // Ensures built files go to the correct location
    rollupOptions: {
      input: "index.html", // Ensures Vite uses index.html as the entry file
    },
  },
});
