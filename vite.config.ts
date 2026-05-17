import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig, loadEnv } from "vite";

/**
 * Post-build plugin: injects the critical JS/CSS asset URLs into sw.js's
 * precache list so the service worker caches them on install, not just on
 * first fetch. Auto-generates the cache name from the asset hash.
 */
function swPrecache(): Plugin {
  return {
    name: "sw-precache",
    apply: "build",
    closeBundle() {
      const distDir = "dist";
      const html = readFileSync(join(distDir, "index.html"), "utf-8");

      const precacheUrls = [
        "./",
        "./index.html",
        "./manifest.json",
        "./favicon.ico",
        "./android-chrome-192x192.png",
        "./android-chrome-384x384.png",
      ];
      const matches = html.match(/(?:src|href)="(\/assets\/[^"]+)"/g) ?? [];
      for (const raw of matches) {
        const path = raw.replace(/^(?:src|href)="/, "").replace(/"$/, "");
        precacheUrls.push(`.${path}`);
      }

      const swPath = join(distDir, "sw.js");
      let sw = readFileSync(swPath, "utf-8");
      const hash = createHash("md5")
        .update(precacheUrls.sort().join(","))
        .digest("hex")
        .slice(0, 8);
      sw = sw.replace(
        /const CACHE_NAME = "[^"]+";/,
        `const CACHE_NAME = "pockewallet-${hash}";`,
      );
      sw = sw.replace(
        /const PRECACHE_URLS = \[[\s\S]*?\];/,
        `const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};`,
      );
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), swPrecache()],
    build: {
      target: "esnext",
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
