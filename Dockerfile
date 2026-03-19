FROM node:22-slim

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copiar arquivos de dependências e patches (necessário para pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar TODAS as dependências (incluindo devDependencies necessárias para o servidor)
RUN pnpm install --frozen-lockfile

# Copiar todo o código fonte (esta camada é invalidada quando qualquer arquivo muda)
COPY . .

# Build do frontend e backend
RUN pnpm run build

# Definir NODE_ENV como production para o servidor usar serveStatic em vez do Vite dev
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
