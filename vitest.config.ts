import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(""), "client", "src"), // Update the alias path
      "@shared": path.resolve(path.dirname(""), "shared"),
      "@assets": path.resolve(path.dirname(""), "attached_assets"),
    },
  },
  root: path.resolve(path.dirname(""), "client"), // Ensure this points to the correct location of index.html
  build: {
    outDir: path.resolve(path.dirname(""), "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["@tanstack/react-query-devtools"],
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
