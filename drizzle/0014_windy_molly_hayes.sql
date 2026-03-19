CREATE TABLE `log_uso_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`solicitacaoId` int DEFAULT NULL,
	`horaEntrada` timestamp DEFAULT NULL,
	`horaSaida` timestamp DEFAULT NULL,
	`tempoRealUsado` int DEFAULT NULL,
	CONSTRAINT `log_uso_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solicitacoes_ticket` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int DEFAULT NULL,
	`ticketId` int DEFAULT NULL,
	`duracaoSolicitada` int DEFAULT NULL,
	`valorPago` decimal(8,2) DEFAULT NULL,
	`qrcodeData` text DEFAULT NULL,
	`dataSolicitacao` timestamp NOT NULL DEFAULT current_timestamp(),
	`status` enum('solicitado','aprovado','usado','cancelado') NOT NULL DEFAULT 'solicitado',
	CONSTRAINT `solicitacoes_ticket_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets_estacionamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`valor` decimal(8,2) DEFAULT NULL,
	`duracaoHoras` int DEFAULT NULL,
	`dataValidade` timestamp DEFAULT NULL,
	`status` enum('disponivel','alocado','usado','expirado') NOT NULL DEFAULT 'disponivel',
	`criadoPor` int DEFAULT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT current_timestamp(),
	CONSTRAINT `tickets_estacionamento_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_estacionamento_codigo_unique` UNIQUE(`codigo`)
);
