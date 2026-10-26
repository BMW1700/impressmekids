import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { resolveMediaAssetUrl } from "./src/lib/native/mediaAssetUrl";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    {
      name: "native-hosted-media",
      enforce: "pre" as const,
      transform(source: string, id: string) {
        if (mode !== "native" || !id.split("?")[0].endsWith(".asset.json")) return;
        const pointer = JSON.parse(source);
        if (typeof pointer.url !== "string") return;
        pointer.url = resolveMediaAssetUrl(pointer.url, true);
        return { code: JSON.stringify(pointer), map: null };
      },
    },
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
