/**
 * mysql-pool.ts
 * Pool de conexões MySQL compartilhado para toda a aplicação.
 *
 * Estratégias de resiliência:
 * 1. connectionLimit: 5 → conservador para plano compartilhado
 * 2. keepAliveInitialDelay: 10s → mantém conexões vivas no Railway
 * 3. Ping periódico a cada 4 minutos → Railway fecha conexões ociosas após ~5min
 * 4. Reconexão automática em caso de PROTOCOL_CONNECTION_LOST
 * 5. Erros do pool são capturados e logados (não derrubam o processo)
 */
import mysql from 'mysql2/promise';
import { getMysqlConnectionConfig, getActiveDbUrl } from './db';

let _pool: mysql.Pool | null = null;
let _pingInterval: ReturnType<typeof setInterval> | null = null;

/** Cria ou retorna o pool singleton */
export function getPool(): mysql.Pool {
  if (!_pool) {
    const activeUrl = getActiveDbUrl();
    const cfg = getMysqlConnectionConfig(activeUrl || undefined);

    console.log(`[mysql-pool] Criando pool com: ${cfg.host}:${cfg.port}/${cfg.database}`);

    _pool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 50,
      connectTimeout: 15_000,
      idleTimeout: 300_000,        // 5 minutos (Railway fecha após ~5min de ociosidade)
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000, // Inicia keep-alive após 10s de ociosidade
    });

    _pool.on('connection', () => {
      console.log('[mysql-pool] Nova conexão criada');
    });

    // Capturar erros do pool para evitar crash do processo
    (_pool as any).on('error', (err: any) => {
      console.warn('[mysql-pool] Erro no pool (capturado):', err?.message || err);
      // Se o pool todo ficou inválido, resetar para forçar recriação
      if (err?.code === 'PROTOCOL_CONNECTION_LOST' || err?.code === 'ECONNRESET') {
        console.warn('[mysql-pool] Resetando pool por perda de conexão...');
        _pool = null;
        if (_pingInterval) {
          clearInterval(_pingInterval);
          _pingInterval = null;
        }
      }
    });

    // Ping periódico a cada 4 minutos para manter conexões vivas
    // Railway fecha conexões ociosas após ~5 minutos
    _pingInterval = setInterval(async () => {
      if (!_pool) {
        if (_pingInterval) clearInterval(_pingInterval);
        return;
      }
      try {
        await _pool.query('SELECT 1');
      } catch (e: any) {
        console.warn('[mysql-pool] Ping falhou:', e?.message);
        // Forçar recriação do pool na próxima chamada
        _pool = null;
        if (_pingInterval) {
          clearInterval(_pingInterval);
          _pingInterval = null;
        }
      }
    }, 4 * 60 * 1000); // 4 minutos

    // Não bloquear o processo com o timer
    if (_pingInterval.unref) _pingInterval.unref();
  }
  return _pool;
}

/**
 * Obtém uma conexão do pool com reconexão automática.
 * Sempre use conn.release() no bloco finally.
 */
export async function getPoolConn(): Promise<mysql.PoolConnection> {
  try {
    const conn = await getPool().getConnection();
    return conn;
  } catch (error: any) {
    const isConnLost =
      error?.code === 'PROTOCOL_CONNECTION_LOST' ||
      error?.code === 'ECONNRESET' ||
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('Connection lost');

    if (isConnLost) {
      console.warn('[mysql-pool] Conexão perdida, recriando pool...');
      if (_pool) {
        try { await _pool.end(); } catch { /* ignore */ }
        _pool = null;
      }
      if (_pingInterval) {
        clearInterval(_pingInterval);
        _pingInterval = null;
      }
      const conn = await getPool().getConnection();
      console.log('[mysql-pool] Reconectado com sucesso');
      return conn;
    }
    console.error('[mysql-pool] Erro ao obter conexão:', error);
    throw error;
  }
}

/** Encerra o pool e o timer de ping */
export async function closePool(): Promise<void> {
  if (_pingInterval) {
    clearInterval(_pingInterval);
    _pingInterval = null;
  }
  if (_pool) {
    await _pool.end();
    _pool = null;
    console.log('[mysql-pool] Pool encerrado');
  }
}
