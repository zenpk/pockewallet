import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    build: {
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("/react/") ||
                id.includes("/react-dom/") ||
                id.includes("/react-router") ||
                id.includes("/scheduler/") ||
                id.includes("/@remix-run/")
              )
                return "vendor";
            }
          },
        },
      },
    },
    server: {
      proxy: {
        "/api/": {
          target: env.VITE_BACKEND_ENDPOINT as string,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
