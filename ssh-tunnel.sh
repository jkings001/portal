#!/bin/bash

# SSH Tunnel para MySQL Hostinger
# Uso: ./ssh-tunnel.sh start|stop|status

TUNNEL_PID_FILE="/tmp/mysql-ssh-tunnel.pid"
SSH_HOST="u298830991@82.25.67.92"
SSH_PORT="65002"
SSH_PASSWORD="Jk1210BlueCat@"
LOCAL_PORT="3307"
REMOTE_HOST="localhost"
REMOTE_PORT="3306"

start_tunnel() {
  if [ -f "$TUNNEL_PID_FILE" ]; then
    PID=$(cat "$TUNNEL_PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "❌ Tunnel já está rodando (PID: $PID)"
      return 1
    fi
  fi
  
  echo "🔄 Iniciando SSH tunnel..."
  sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -N -L $LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    "$SSH_HOST" &
  
  PID=$!
  echo $PID > "$TUNNEL_PID_FILE"
  sleep 2
  
  if ps -p $PID > /dev/null 2>&1; then
    echo "✅ SSH tunnel iniciado (PID: $PID)"
    echo "   Local: localhost:$LOCAL_PORT"
    echo "   Remote: $REMOTE_HOST:$REMOTE_PORT"
    return 0
  else
    echo "❌ Falha ao iniciar tunnel"
    rm -f "$TUNNEL_PID_FILE"
    return 1
  fi
}

stop_tunnel() {
  if [ -f "$TUNNEL_PID_FILE" ]; then
    PID=$(cat "$TUNNEL_PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      kill $PID
      sleep 1
      if ps -p $PID > /dev/null 2>&1; then
        kill -9 $PID
      fi
      rm -f "$TUNNEL_PID_FILE"
      echo "✅ SSH tunnel parado"
      return 0
    fi
  fi
  echo "❌ Tunnel não está rodando"
  return 1
}

status_tunnel() {
  if [ -f "$TUNNEL_PID_FILE" ]; then
    PID=$(cat "$TUNNEL_PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "✅ SSH tunnel está rodando (PID: $PID)"
      return 0
    fi
  fi
  echo "❌ SSH tunnel não está rodando"
  return 1
}

case "$1" in
  start)
    start_tunnel
    ;;
  stop)
    stop_tunnel
    ;;
  status)
    status_tunnel
    ;;
  restart)
    stop_tunnel
    sleep 2
    start_tunnel
    ;;
  *)
    echo "Uso: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
