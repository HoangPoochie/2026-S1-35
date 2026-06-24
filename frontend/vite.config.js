import { defineConfig } from "vite";

// VITE_ALLOWED_HOSTS lets a named Cloudflare Tunnel's custom domain through
// (set in docker/.env); the Quick Tunnel's random hostname is covered by
// the .trycloudflare.com wildcard below.
const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: [".trycloudflare.com", ...extraAllowedHosts],
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
