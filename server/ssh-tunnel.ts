/**
 * Módulo de Túnel SSH - DESATIVADO
 * O projeto agora utiliza conexão direta com o MySQL do Railway.
 * Este arquivo foi mantido para compatibilidade de importação, mas redireciona para o Railway.
 */

/**
 * Verifica se o túnel SSH está ativo (Sempre true para Railway)
 */
export function isTunnelActive(): boolean {
  return true;
}

/**
 * Inicia o túnel SSH (No-op para Railway)
 */
export async function startSshTunnel(): Promise<boolean> {
  console.log('[SSH Tunnel] Conexão direta com Railway ativa. Ignorando túnel SSH.');
  return true;
}

/**
 * Para o túnel SSH (No-op)
 */
export function stopSshTunnel(): void {
  // No-op
}

/**
 * Retorna a URL de conexão MySQL do Railway
 * Usa variáveis de ambiente — nunca hardcoded
 */
export function getTunnelMysqlUrl(): string {
  const url = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (!url) {
    console.warn('[SSH Tunnel] Nenhuma URL de banco de dados configurada. Verifique as variáveis de ambiente.');
  }
  return url || '';
}

/**
 * Retorna a configuração de conexão MySQL do Railway
 * Usa variáveis de ambiente — nunca hardcoded
 */
export function getTunnelMysqlConfig() {
  const url = getTunnelMysqlUrl();
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
        connectTimeout: 15000,
      };
    } catch {
      // fallthrough
    }
  }
  return {
    host: process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'railway',
    connectTimeout: 15000,
  };
}
