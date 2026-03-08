import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vitest/config";

// Compatível com Node.js 18+ e esbuild ESM bundle
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateRoot = path.resolve(__dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
  },
});
