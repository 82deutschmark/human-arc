/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Support Human ARC at a configurable hosting prefix within ARC Explainer.
 * SRP/DRY check: Pass — shared appPath helper keeps application and asset URLs consistent.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: process.env.HARC_BASE_PATH || "/",
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
