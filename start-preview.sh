#!/bin/bash
# ============================================================
# Script de inicialização do ambiente de PREVIEW
# Portal de Atendimento JKINGS
# ============================================================
# Uso: ./start-preview.sh
# O servidor inicia na porta 3001 com hot-reload ativo.
# Qualquer alteração nos arquivos reinicia automaticamente.
# ============================================================

PREVIEW_DIR="/home/ubuntu/portal-preview"
LOG_FILE="/tmp/portal-preview.log"
PORT=3001

echo "🔄 Verificando processos anteriores na porta $PORT..."
fuser -k ${PORT}/tcp 2>/dev/null && echo "✅ Porta $PORT liberada" || echo "ℹ️  Porta $PORT já estava livre"

echo ""
echo "📦 Atualizando código da branch staging..."
cd "$PREVIEW_DIR" && git pull origin staging 2>&1 | tail -3

echo ""
echo "🚀 Iniciando servidor de preview na porta $PORT..."
PORT=$PORT pnpm dev </dev/null >"$LOG_FILE" 2>&1 &
PREVIEW_PID=$!
echo "PID: $PREVIEW_PID"

echo ""
echo "⏳ Aguardando inicialização..."
sleep 10

if ss -tlnp | grep -q ":${PORT}"; then
  echo "✅ Servidor de preview rodando na porta $PORT!"
  echo ""
  echo "📋 Log de inicialização:"
  cat "$LOG_FILE"
else
  echo "❌ Falha ao iniciar. Verifique o log:"
  cat "$LOG_FILE"
fi
