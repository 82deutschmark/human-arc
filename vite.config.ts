import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  build: {
    target: 'es2022',
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      external: ['playfab-web-sdk'],
    },
    commonjsOptions: {
      include: /node_modules|playfab-web-sdk/
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
