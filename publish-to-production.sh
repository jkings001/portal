#!/bin/bash
# ============================================================
# Script para publicar alterações do STAGING para PRODUÇÃO
# Portal de Atendimento JKINGS
# ============================================================
# Uso: ./publish-to-production.sh "Mensagem do commit"
# Faz merge da branch staging para main e dispara deploy no Railway.
# ============================================================

PREVIEW_DIR="/home/ubuntu/portal-preview"
COMMIT_MSG="${1:-Deploy: publicando alterações do staging para produção}"

cd "$PREVIEW_DIR"

echo "📋 Status atual:"
git status --short

echo ""
echo "💾 Commitando alterações na branch staging..."
git add -A
git commit -m "$COMMIT_MSG" 2>/dev/null || echo "ℹ️  Nada para commitar"
git push origin staging 2>&1 | tail -3

echo ""
echo "🔀 Fazendo merge do staging para main (produção)..."
git checkout main
git pull origin main
git merge staging --no-ff -m "Merge staging -> main: $COMMIT_MSG"
git push origin main 2>&1 | tail -3

echo ""
echo "✅ Publicado! O Railway irá fazer o deploy automaticamente."
echo "🌐 Acompanhe em: https://railway.com/project/e63f2120-3311-4346-9275-b20f6dc933ca"
echo "🔗 Site em produção: https://jkings.solutions"

# Voltar para staging
git checkout staging
