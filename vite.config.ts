import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { crx } from "@crxjs/vite-plugin";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.json";
import packageJson from "./package.json";

const extensionManifest = {
  ...manifest,
  version: packageJson.version,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    crx({ manifest: extensionManifest }), 
    zip({
      outDir: "release", // Folder where the zip will be saved
      outFileName: "bundle.zip", // Name of the final package
    }),
  ],
  build: {
    rollupOptions: {
      input: "index.html",
    },
  },
});
