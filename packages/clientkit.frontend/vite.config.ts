// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist/src",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: "src/index.html",
        error: "src/error.html",
      },
    },
  },
  base: "./",
  plugins: [react()],
});
