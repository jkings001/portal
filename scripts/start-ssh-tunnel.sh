#!/bin/bash
# Script para manter o túnel SSH ativo para o banco Hostinger
# Executa em loop e reinicia o túnel se cair

SSH_HOST="82.25.67.92"
SSH_PORT="65002"
SSH_USER="u298830991"
SSH_PASS="Jkadm2010BlueCat@"
LOCAL_PORT="3307"
REMOTE_PORT="3306"

echo "[SSH Tunnel] Iniciando túnel SSH para Hostinger..."

while true; do
  sshpass -p "$SSH_PASS" ssh \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -p "$SSH_PORT" \
    -N \
    -L "${LOCAL_PORT}:localhost:${REMOTE_PORT}" \
    "${SSH_USER}@${SSH_HOST}"
  
  echo "[SSH Tunnel] Túnel caiu. Reiniciando em 5 segundos..."
  sleep 5
done
