import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";

// Compatível com Node.js 18+ e esbuild ESM bundle
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Modo DESENVOLVIMENTO: usa o Vite dev server com HMR.
 * Todos os imports do Vite são feitos via string dinâmica com concatenação
 * para que o esbuild NÃO resolva nem inclua vite ou vite.config no bundle.
 */
export async function setupVite(app: Express, server: Server) {
  // Usar Function constructor para importação totalmente opaca ao esbuild
  // Isso impede que o bundler inclua vite ou vite.config no dist/index.js
  const dynamicImport = new Function("specifier", "return import(specifier)");

  const { createServer: createViteServer } = await dynamicImport("vite");
  const { nanoid } = await dynamicImport("nanoid");

  // Carregar vite.config do disco em tempo de execução (não bundled)
  const configPath = path.resolve(__dirname, "..", "..", "vite.config.ts");
  const { default: viteConfig } = await dynamicImport(configPath);

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req: any, res: any, next: any) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Modo PRODUÇÃO: serve os arquivos estáticos gerados pelo `vite build`.
 * Em produção, __dirname aponta para dist/ (onde o bundle está),
 * portanto "public" resolve para dist/public/.
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, "../..", "dist", "public")
      : path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `[warn] Build directory not found: ${distPath}. Run 'pnpm build' first.`
    );
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html para todas as rotas não encontradas
  app.use("*", (_req: any, res: any) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
