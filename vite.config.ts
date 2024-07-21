import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      VitePWA({
        manifest: {
          name: "Pockewallet",
          short_name: "Pockewallet",
          description: "Keep track of your expenses",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "any",
          start_url: "./",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "android-chrome-384x384.png",
              sizes: "384x384",
              type: "image/png",
            },
          ],
        },
      }),
    ],
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
