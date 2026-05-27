import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true
      },
      "/uploads": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true
      },
      "/health": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true
      }
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ["**/node_modules/**", "**/dist/**"],
    },
  },
});
