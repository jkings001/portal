/**
 * server.js — Entry point para a Hostinger
 * 
 * A Hostinger requer que o arquivo de entrada do Node.js se chame server.js
 * na raiz do projeto. Este arquivo simplesmente importa o servidor compilado.
 * 
 * Estrutura após o build:
 *   dist/index.js      → servidor Express compilado (backend + rotas)
 *   dist/public/       → frontend React compilado (HTML, CSS, JS)
 */

import('./dist/index.js').catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
