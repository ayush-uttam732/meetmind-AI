import { defineConfig } from "vite";
import { resolve } from "node:path";


export default defineConfig({
  css: {
    postcss: {
      plugins: []
    }
  },
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "popup/popup": resolve(__dirname, "src/popup/popup.html"),
        "sidepanel/sidepanel": resolve(__dirname, "src/sidepanel/sidepanel.html"),
        "options/options": resolve(__dirname, "src/options/options.html"),
        "background/service-worker": resolve(__dirname, "src/background/service-worker.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
