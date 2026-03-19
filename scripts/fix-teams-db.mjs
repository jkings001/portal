import { createPool } from 'mysql2/promise';

// Banco de produção da Hostinger
const pool = createPool({
  host: 'srv1706.hstgr.io',
  port: 3306,
  user: 'u298830991_adm',
  password: 'Jkadm1210###',
  database: 'u298830991_jkingsdb',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 15000,
});

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('✅ Conectado ao banco de produção Hostinger');

    // 1. Verificar se userId é NOT NULL na tabela requests
    const [cols] = await conn.query("SHOW COLUMNS FROM requests WHERE Field = 'userId'");
    console.log('requests.userId atual:', JSON.stringify(cols[0]));

    // 2. Alterar userId para aceitar NULL
    await conn.query('ALTER TABLE `requests` MODIFY COLUMN `userId` INT DEFAULT NULL');
    console.log('✅ requests.userId alterado para aceitar NULL');

    // 3. Criar tabela support_history se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`support_history\` (
        \`id\`          INT          NOT NULL AUTO_INCREMENT,
        \`itemType\`    VARCHAR(50)  NOT NULL DEFAULT 'request',
        \`itemId\`      INT          NOT NULL,
        \`action\`      VARCHAR(100) NOT NULL,
        \`description\` TEXT         DEFAULT NULL,
        \`userId\`      INT          DEFAULT NULL,
        \`userName\`    VARCHAR(255) DEFAULT NULL,
        \`createdAt\`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`support_history_itemId_idx\` (\`itemId\`),
        KEY \`support_history_userId_idx\` (\`userId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela support_history criada/verificada');

    // 4. Criar tabelas Teams se não existirem
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`teams_subscriptions\` (
        \`id\`                       INT          NOT NULL AUTO_INCREMENT,
        \`subscriptionId\`           VARCHAR(255) NOT NULL,
        \`resource\`                 TEXT         NOT NULL,
        \`changeType\`               VARCHAR(100) NOT NULL DEFAULT 'created',
        \`expirationDateTime\`       VARCHAR(50)  NOT NULL,
        \`clientState\`              VARCHAR(255) NOT NULL,
        \`notificationUrl\`          TEXT         NOT NULL,
        \`lifecycleNotificationUrl\` TEXT         DEFAULT NULL,
        \`status\`                   ENUM('active','expired','error') NOT NULL DEFAULT 'active',
        \`metadata\`                 JSON         DEFAULT NULL,
        \`createdAt\`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`teams_subscriptions_subscriptionId_unique\` (\`subscriptionId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela teams_subscriptions criada/verificada');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`teams_integration_events\` (
        \`id\`               INT          NOT NULL AUTO_INCREMENT,
        \`messageId\`        VARCHAR(255) NOT NULL,
        \`eventType\`        VARCHAR(100) NOT NULL DEFAULT 'message_received',
        \`userEmail\`        VARCHAR(255) DEFAULT NULL,
        \`payload\`          JSON         DEFAULT NULL,
        \`processingStatus\` ENUM('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
        \`errorMessage\`     TEXT         DEFAULT NULL,
        \`processedAt\`      TIMESTAMP    DEFAULT NULL,
        \`createdAt\`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`teams_events_messageId_unique\` (\`messageId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela teams_integration_events criada/verificada');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`teams_message_ticket_map\` (
        \`id\`        INT          NOT NULL AUTO_INCREMENT,
        \`messageId\` VARCHAR(255) NOT NULL,
        \`ticketId\`  INT          NOT NULL,
        \`userId\`    INT          DEFAULT NULL,
        \`category\`  VARCHAR(100) DEFAULT 'Geral',
        \`priority\`  VARCHAR(50)  DEFAULT 'media',
        \`createdAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`teams_map_messageId_unique\` (\`messageId\`),
        KEY \`teams_map_ticketId_idx\` (\`ticketId\`),
        KEY \`teams_map_userId_idx\` (\`userId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela teams_message_ticket_map criada/verificada');

    // 5. Verificar colunas externalMessageId e metadata na tabela requests
    const [extCol] = await conn.query("SHOW COLUMNS FROM requests WHERE Field = 'externalMessageId'");
    if (extCol.length === 0) {
      await conn.query("ALTER TABLE `requests` ADD COLUMN `externalMessageId` VARCHAR(255) DEFAULT NULL");
      await conn.query("CREATE INDEX `requests_externalMessageId_idx` ON `requests` (`externalMessageId`)");
      console.log('✅ Coluna externalMessageId adicionada à tabela requests');
    } else {
      console.log('✅ Coluna externalMessageId já existe');
    }

    const [metaCol] = await conn.query("SHOW COLUMNS FROM requests WHERE Field = 'metadata'");
    if (metaCol.length === 0) {
      await conn.query("ALTER TABLE `requests` ADD COLUMN `metadata` JSON DEFAULT NULL");
      console.log('✅ Coluna metadata adicionada à tabela requests');
    } else {
      console.log('✅ Coluna metadata já existe');
    }

    console.log('\n🎉 Todas as correções aplicadas com sucesso!');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
