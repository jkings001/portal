CREATE TABLE `arquivos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`nomeOriginal` varchar(255) NOT NULL,
	`caminho` varchar(500) NOT NULL,
	`tipo` enum('documento','imagem','video','outro') NOT NULL DEFAULT 'documento',
	`mimeType` varchar(100) DEFAULT NULL,
	`tamanho` int NOT NULL DEFAULT 0,
	`chamadoId` int DEFAULT NULL,
	`ativoId` int DEFAULT NULL,
	`usuarioId` int NOT NULL,
	`departamentoId` int DEFAULT NULL,
	`descricao` text DEFAULT NULL,
	`tags` varchar(500) DEFAULT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT current_timestamp(),
	`updatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
	CONSTRAINT `arquivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ativos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serial` varchar(100) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`tipo` enum('hardware','software','licenca') NOT NULL,
	`departamentoId` int DEFAULT NULL,
	`usuarioId` int DEFAULT NULL,
	`status` enum('disponivel','alocado','manutencao','descartado') NOT NULL DEFAULT 'disponivel',
	`custo` decimal(10,2) DEFAULT NULL,
	`dataAquisicao` date DEFAULT NULL,
	`descricao` text DEFAULT NULL,
	`fabricante` varchar(100) DEFAULT NULL,
	`modelo` varchar(100) DEFAULT NULL,
	`garantiaAte` date DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
	`updatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
	CONSTRAINT `ativos_id` PRIMARY KEY(`id`),
	CONSTRAINT `ativos_serial_unique` UNIQUE(`serial`)
);
--> statement-breakpoint
CREATE TABLE `permissoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`recursoId` int NOT NULL,
	`recursoTipo` enum('departamento','chamado','ativo','arquivo') NOT NULL,
	`permissao` enum('ler','escrever','gerenciar','admin') NOT NULL,
	`concedidoPor` int DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
	`updatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
	CONSTRAINT `permissoes_id` PRIMARY KEY(`id`)
);
