#!/bin/bash
# ============================================================
# Túnel SSH para banco MySQL da Hostinger
# Uso: ./scripts/ssh-tunnel.sh [start|stop|status]
# ============================================================

SSH_HOST="82.25.67.92"
SSH_PORT="65002"
SSH_USER="u298830991"
SSH_KEY="$HOME/.ssh/jkings_portal"
LOCAL_PORT="3307"
REMOTE_HOST="127.0.0.1"
REMOTE_PORT="3306"
PID_FILE="/tmp/ssh-tunnel-jkings.pid"

start_tunnel() {
  if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "✅ Túnel já está ativo (PID: $(cat $PID_FILE))"
    return 0
  fi

  echo "🔌 Iniciando túnel SSH..."
  echo "   SSH: $SSH_USER@$SSH_HOST:$SSH_PORT"
  echo "   MySQL local: localhost:$LOCAL_PORT → $REMOTE_HOST:$REMOTE_PORT"

  ssh -f -N \
    -i "$SSH_KEY" \
    -p "$SSH_PORT" \
    -L "$LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT" \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    "$SSH_USER@$SSH_HOST"

  if [ $? -eq 0 ]; then
    # Salvar PID do processo SSH
    pgrep -f "ssh.*$LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT" > "$PID_FILE"
    echo "✅ Túnel ativo! PID: $(cat $PID_FILE)"
    echo "   Conecte ao MySQL em: localhost:$LOCAL_PORT"
    echo "   Usuário: u298830991_admin"
    echo "   Banco: u298830991_portal"
  else
    echo "❌ Falha ao iniciar túnel SSH"
    exit 1
  fi
}

stop_tunnel() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      rm -f "$PID_FILE"
      echo "🛑 Túnel encerrado (PID: $PID)"
    else
      echo "⚠️  Processo não encontrado, limpando PID file"
      rm -f "$PID_FILE"
    fi
  else
    # Tentar matar por padrão
    pkill -f "ssh.*$LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT" 2>/dev/null
    echo "🛑 Túnel encerrado"
  fi
}

status_tunnel() {
  if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "✅ Túnel ATIVO (PID: $(cat $PID_FILE))"
    echo "   MySQL disponível em: localhost:$LOCAL_PORT"
  else
    echo "❌ Túnel INATIVO"
  fi
}

case "$1" in
  start)  start_tunnel ;;
  stop)   stop_tunnel ;;
  status) status_tunnel ;;
  *)
    echo "Uso: $0 [start|stop|status]"
    echo ""
    echo "  start  - Inicia o túnel SSH"
    echo "  stop   - Para o túnel SSH"
    echo "  status - Verifica status do túnel"
    ;;
esac
