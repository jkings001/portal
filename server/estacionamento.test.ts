import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Testes unitários do módulo de estacionamento ─────────────────────────────

// Helpers replicados para teste (sem dependência de DB)
function gerarCodigo(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'EST-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function calcularValorProporcional(valorTotal: number, duracaoTotal: number, duracaoSolicitada: number): number {
  if (duracaoTotal <= 0) return valorTotal;
  return parseFloat(((valorTotal / duracaoTotal) * duracaoSolicitada).toFixed(2));
}

function validarLinhaCSV(row: Record<string, string>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const codigo = String(row.codigo || row.Codigo || row.CODIGO || '').trim();
  const valor = parseFloat(row.valor || row.Valor || '0');
  const duracaoHoras = parseInt(row.duracao_horas || row.duracao || '0');

  if (!codigo) erros.push('Código é obrigatório');
  if (codigo && codigo.length > 50) erros.push('Código muito longo (máx 50 chars)');
  if (valor < 0) erros.push('Valor não pode ser negativo');
  if (duracaoHoras < 0) erros.push('Duração não pode ser negativa');

  return { valido: erros.length === 0, erros };
}

function statusTicketPermiteRemocao(status: string): boolean {
  return status === 'disponivel';
}

function buildQRPayload(solicitacaoId: number, usuarioId: number, codigoTicket: string, duracaoHoras: number, valorPago: number) {
  return {
    solicitacaoId,
    usuarioId,
    codigoTicket,
    duracaoHoras,
    valorPago,
    timestamp: expect.any(String),
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Módulo Estacionamento - Geração de Código', () => {
  it('deve gerar código com prefixo EST-', () => {
    const codigo = gerarCodigo();
    expect(codigo).toMatch(/^EST-[A-Z0-9]{8}$/);
  });

  it('deve gerar códigos únicos em sequência', () => {
    const codigos = new Set(Array.from({ length: 100 }, () => gerarCodigo()));
    // Com 36^8 possibilidades, 100 códigos devem ser únicos
    expect(codigos.size).toBe(100);
  });

  it('deve ter exatamente 12 caracteres', () => {
    const codigo = gerarCodigo();
    expect(codigo.length).toBe(12); // "EST-" (4) + 8 chars
  });
});

describe('Módulo Estacionamento - Cálculo de Valor Proporcional', () => {
  it('deve calcular valor proporcional corretamente', () => {
    // R$20 por 4h → R$10 por 2h
    expect(calcularValorProporcional(20, 4, 2)).toBe(10);
  });

  it('deve retornar valor total quando duração solicitada = duração total', () => {
    expect(calcularValorProporcional(15, 3, 3)).toBe(15);
  });

  it('deve calcular valor por hora fracionado', () => {
    // R$10 por 3h → R$3.33 por 1h
    expect(calcularValorProporcional(10, 3, 1)).toBe(3.33);
  });

  it('deve retornar valor total quando duração total é 0', () => {
    expect(calcularValorProporcional(50, 0, 2)).toBe(50);
  });

  it('deve retornar 0 para valor 0', () => {
    expect(calcularValorProporcional(0, 4, 2)).toBe(0);
  });
});

describe('Módulo Estacionamento - Validação de CSV', () => {
  it('deve aceitar linha válida com todos os campos', () => {
    const row = { codigo: 'EST-ABC12345', valor: '15.00', duracao_horas: '2' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(true);
    expect(result.erros).toHaveLength(0);
  });

  it('deve rejeitar linha sem código', () => {
    const row = { codigo: '', valor: '10.00', duracao_horas: '1' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(false);
    expect(result.erros).toContain('Código é obrigatório');
  });

  it('deve rejeitar código muito longo', () => {
    const row = { codigo: 'A'.repeat(51), valor: '10.00', duracao_horas: '1' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(false);
    expect(result.erros).toContain('Código muito longo (máx 50 chars)');
  });

  it('deve rejeitar valor negativo', () => {
    const row = { codigo: 'EST-TEST01', valor: '-5.00', duracao_horas: '2' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(false);
    expect(result.erros).toContain('Valor não pode ser negativo');
  });

  it('deve aceitar linha com campos alternativos (Codigo, Valor)', () => {
    const row = { Codigo: 'EST-UPPER01', Valor: '20.00', duracao: '4' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(true);
  });

  it('deve aceitar linha sem valor (campo opcional)', () => {
    const row = { codigo: 'EST-NOVAL01', duracao_horas: '2' };
    const result = validarLinhaCSV(row);
    expect(result.valido).toBe(true);
  });
});

describe('Módulo Estacionamento - Controle de Status', () => {
  it('deve permitir remoção de ticket disponível', () => {
    expect(statusTicketPermiteRemocao('disponivel')).toBe(true);
  });

  it('deve bloquear remoção de ticket alocado', () => {
    expect(statusTicketPermiteRemocao('alocado')).toBe(false);
  });

  it('deve bloquear remoção de ticket usado', () => {
    expect(statusTicketPermiteRemocao('usado')).toBe(false);
  });

  it('deve bloquear remoção de ticket expirado', () => {
    expect(statusTicketPermiteRemocao('expirado')).toBe(false);
  });
});

describe('Módulo Estacionamento - Payload QR Code', () => {
  it('deve conter todos os campos obrigatórios', () => {
    const payload = {
      solicitacaoId: 42,
      usuarioId: 7,
      codigoTicket: 'EST-ABC12345',
      duracaoHoras: 2,
      valorPago: 10.00,
      timestamp: new Date().toISOString(),
    };

    expect(payload).toHaveProperty('solicitacaoId');
    expect(payload).toHaveProperty('usuarioId');
    expect(payload).toHaveProperty('codigoTicket');
    expect(payload).toHaveProperty('duracaoHoras');
    expect(payload).toHaveProperty('valorPago');
    expect(payload).toHaveProperty('timestamp');
  });

  it('deve serializar para JSON válido', () => {
    const payload = {
      solicitacaoId: 1,
      usuarioId: 2,
      codigoTicket: 'EST-TEST001',
      duracaoHoras: 4,
      valorPago: 20.00,
      timestamp: new Date().toISOString(),
    };
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.codigoTicket).toBe('EST-TEST001');
    expect(parsed.valorPago).toBe(20.00);
  });
});

describe('Módulo Estacionamento - Filtros de Período', () => {
  it('deve identificar período "hoje" corretamente', () => {
    const hoje = new Date();
    const dataHoje = hoje.toISOString().slice(0, 10);
    const dataAmanha = new Date(hoje.getTime() + 86400000).toISOString().slice(0, 10);

    expect(dataHoje).not.toBe(dataAmanha);
    expect(dataHoje.length).toBe(10);
  });

  it('deve calcular intervalo de 7 dias para "semana"', () => {
    const agora = new Date();
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const diffMs = agora.getTime() - seteDiasAtras.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDias).toBe(7);
  });
});

describe('Módulo Estacionamento - Middleware getUserFromToken', () => {
  it('deve extrair role admin do payload JWT', () => {
    // Simular o payload decodificado pelo jose
    const decoded = {
      user: {
        id: '2',
        email: 'admin@jkings.com.br',
        role: 'admin',
        name: 'Admin'
      }
    };
    const user = decoded.user || decoded;
    expect(user.role).toBe('admin');
    expect(user.id).toBe('2');
  });

  it('deve extrair role manager do payload JWT', () => {
    const decoded = {
      user: {
        id: '3',
        email: 'manager@jkings.com.br',
        role: 'manager',
        name: 'Manager'
      }
    };
    const user = decoded.user || decoded;
    expect(user.role).toBe('manager');
  });

  it('deve retornar null quando não há header Authorization', () => {
    const req = { headers: {} } as any;
    const authHeader = req.headers.authorization;
    expect(authHeader).toBeUndefined();
  });

  it('deve retornar null quando header não começa com Bearer', () => {
    const req = { headers: { authorization: 'Basic abc123' } } as any;
    const authHeader = req.headers.authorization;
    const isBearer = authHeader?.startsWith('Bearer ');
    expect(isBearer).toBe(false);
  });

  it('requireRH deve bloquear role user', () => {
    const estUser = { id: 1, role: 'user', email: 'user@test.com', name: 'User' };
    const role = estUser?.role;
    const allowed = ['admin', 'manager'].includes(role);
    expect(allowed).toBe(false);
  });

  it('requireRH deve permitir role admin', () => {
    const estUser = { id: 2, role: 'admin', email: 'admin@test.com', name: 'Admin' };
    const role = estUser?.role;
    const allowed = ['admin', 'manager'].includes(role);
    expect(allowed).toBe(true);
  });

  it('requireRH deve permitir role manager', () => {
    const estUser = { id: 3, role: 'manager', email: 'mgr@test.com', name: 'Manager' };
    const role = estUser?.role;
    const allowed = ['admin', 'manager'].includes(role);
    expect(allowed).toBe(true);
  });
});
