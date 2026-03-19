import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'u298830991_admin',
  password: 'Jk1210BlueCat',
  database: 'u298830991_portal',
  connectTimeout: 8000,
});

const tables = [
  `CREATE TABLE IF NOT EXISTS ativos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    serial VARCHAR(100) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo ENUM('hardware','software','licenca') NOT NULL,
    departamentoId INT DEFAULT NULL,
    usuarioId INT DEFAULT NULL,
    status ENUM('disponivel','alocado','manutencao','descartado') NOT NULL DEFAULT 'disponivel',
    custo DECIMAL(10,2) DEFAULT NULL,
    dataAquisicao DATE DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    fabricante VARCHAR(100) DEFAULT NULL,
    modelo VARCHAR(100) DEFAULT NULL,
    garantiaAte DATE DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY ativos_serial_unique (serial),
    INDEX idx_ativos_departamento (departamentoId),
    INDEX idx_ativos_usuario (usuarioId),
    INDEX idx_ativos_status (status),
    INDEX idx_ativos_tipo (tipo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS arquivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    nomeOriginal VARCHAR(255) NOT NULL,
    caminho VARCHAR(500) NOT NULL,
    tipo ENUM('documento','imagem','video','outro') NOT NULL DEFAULT 'documento',
    mimeType VARCHAR(100) DEFAULT NULL,
    tamanho INT NOT NULL DEFAULT 0,
    chamadoId INT DEFAULT NULL,
    ativoId INT DEFAULT NULL,
    usuarioId INT NOT NULL,
    departamentoId INT DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    tags VARCHAR(500) DEFAULT NULL,
    uploadedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_arquivos_chamado (chamadoId),
    INDEX idx_arquivos_ativo (ativoId),
    INDEX idx_arquivos_usuario (usuarioId),
    INDEX idx_arquivos_departamento (departamentoId),
    INDEX idx_arquivos_tipo (tipo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS permissoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuarioId INT NOT NULL,
    recursoId INT NOT NULL,
    recursoTipo ENUM('departamento','chamado','ativo','arquivo') NOT NULL,
    permissao ENUM('ler','escrever','gerenciar','admin') NOT NULL,
    concedidoPor INT DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_permissoes_usuario (usuarioId),
    INDEX idx_permissoes_recurso (recursoId, recursoTipo),
    UNIQUE KEY permissoes_unique (usuarioId, recursoId, recursoTipo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

try {
  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    await conn.execute(sql);
    console.log(`✅ Tabela '${tableName}' criada/verificada`);
  }

  const [rows] = await conn.execute('SHOW TABLES');
  const allTables = rows.map(r => Object.values(r)[0]);
  const newTables = allTables.filter(t => ['ativos','arquivos','permissoes'].includes(t));
  console.log('\nTabelas ITAM no banco:', newTables.join(', '));
  console.log('Total de tabelas no banco:', allTables.length);
} catch (e) {
  console.error('Erro:', e.message);
} finally {
  await conn.end();
}
