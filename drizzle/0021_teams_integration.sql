-- ─── Migração 0021: Integração Microsoft Teams ───────────────────────────────
--
-- Tabelas criadas:
--   1. teams_subscriptions         → subscriptions do Microsoft Graph
--   2. teams_integration_events    → log de webhooks recebidos (idempotência)
--   3. teams_message_ticket_map    → mapa messageId → chamado (requests)
--
-- Alteração:
--   4. requests                    → colunas externalMessageId + metadata
--
-- Pré-requisito: tabela `requests` já existe (criada por support-routes.ts)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Subscriptions do Microsoft Graph
CREATE TABLE IF NOT EXISTS `teams_subscriptions` (
  `id`                       INT          NOT NULL AUTO_INCREMENT,
  `subscriptionId`           VARCHAR(255) NOT NULL,
  `resource`                 TEXT         NOT NULL,
  `changeType`               VARCHAR(100) NOT NULL DEFAULT 'created',
  `expirationDateTime`       VARCHAR(50)  NOT NULL,
  `clientState`              VARCHAR(255) NOT NULL,
  `notificationUrl`          TEXT         NOT NULL,
  `lifecycleNotificationUrl` TEXT         DEFAULT NULL,
  `status`                   ENUM('active','expired','error') NOT NULL DEFAULT 'active',
  `metadata`                 JSON         DEFAULT NULL,
  `createdAt`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_subscriptions_subscriptionId_unique` (`subscriptionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Log de eventos / webhooks recebidos
CREATE TABLE IF NOT EXISTS `teams_integration_events` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `messageId`        VARCHAR(255) NOT NULL,
  `eventType`        VARCHAR(100) NOT NULL DEFAULT 'message_received',
  `userEmail`        VARCHAR(255) DEFAULT NULL,
  `payload`          JSON         DEFAULT NULL,
  `processingStatus` ENUM('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
  `errorMessage`     TEXT         DEFAULT NULL,
  `processedAt`      TIMESTAMP    DEFAULT NULL,
  `createdAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_events_messageId_unique` (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Mapa messageId → chamado (requests)
CREATE TABLE IF NOT EXISTS `teams_message_ticket_map` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `messageId` VARCHAR(255) NOT NULL,
  `ticketId`  INT          NOT NULL,
  `userId`    INT          DEFAULT NULL,
  `category`  VARCHAR(100) DEFAULT 'Geral',
  `priority`  VARCHAR(50)  DEFAULT 'media',
  `createdAt` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_map_messageId_unique` (`messageId`),
  KEY `teams_map_ticketId_idx` (`ticketId`),
  KEY `teams_map_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--- 4. Adicionar colunas à tabela requests (se ainda não existirem)
--    externalMessageId: ID da mensagem de origem no Teams
--    metadata:          JSON com metadados da integração (teamId, channelId, etc.)
--
-- NOTA: MySQL 9.x não suporta ADD COLUMN IF NOT EXISTS.
-- Use o script scripts/add-columns.mjs para aplicação idempotente.
-- Os comandos abaixo são para referência e ambientes que suportam a sintaxe:
--
-- ALTER TABLE `requests`
--   ADD COLUMN `externalMessageId` VARCHAR(255) DEFAULT NULL,
--   ADD COLUMN `metadata`          JSON         DEFAULT NULL;
--
-- CREATE INDEX `requests_externalMessageId_idx`
--   ON `requests` (`externalMessageId`);
--
-- Para aplicação automática com verificação, execute:
--   node scripts/add-columns.mjs
