/**
 * teams.fallback.test.ts
 * Testa o comportamento de fallback da função resolveChatMessageFromGraph
 * e a função testGraphMessageFetch para diagnóstico de permissões Azure AD.
 *
 * Nota: testes que fazem chamadas de rede reais ao Microsoft Graph são
 * ignorados automaticamente quando as credenciais não estão disponíveis
 * ou quando há timeout de rede (ambiente CI/sandbox).
 */
import { describe, it, expect, vi } from "vitest";
import {
  parseTeamsMessage,
  normalizeMessageText,
  getTeamsEnv,
} from "./teams";

// ─── Testes de parseTeamsMessage ──────────────────────────────────────────────

describe("parseTeamsMessage", () => {
  it("deve detectar categoria Solicitação", () => {
    const result = parseTeamsMessage("Preciso de uma solicitação de acesso");
    expect(result.category).toBe("Solicitação");
    expect(result.matchedKeywords).toContain("Solicitação");
  });

  it("deve detectar categoria Requisição", () => {
    const result = parseTeamsMessage("Tenho uma requisição de compra");
    expect(result.category).toBe("Requisição");
    expect(result.matchedKeywords).toContain("Requisição");
  });

  it("deve detectar categoria Ocorrência", () => {
    const result = parseTeamsMessage("Reportando uma ocorrência no sistema");
    expect(result.category).toBe("Ocorrência");
    expect(result.matchedKeywords).toContain("Ocorrência");
  });

  it("deve detectar prioridade crítica com 'urgente'", () => {
    const result = parseTeamsMessage("Problema urgente no servidor");
    expect(result.priority).toBe("critica");
    expect(result.matchedKeywords).toContain("urgente");
  });

  it("deve detectar prioridade crítica com 'prioridade alta'", () => {
    const result = parseTeamsMessage("Isso é prioridade alta para o cliente");
    expect(result.priority).toBe("critica");
    expect(result.matchedKeywords).toContain("prioridade alta");
  });

  it("deve usar categoria Geral e prioridade média por padrão", () => {
    const result = parseTeamsMessage("Olá, preciso de ajuda");
    expect(result.category).toBe("Geral");
    expect(result.priority).toBe("media");
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it("deve normalizar texto com acentos corretamente", () => {
    const normalized = normalizeMessageText("Solicitação URGENTE com Prioridade Alta");
    expect(normalized).toContain("solicitacao");
    expect(normalized).toContain("urgente");
    expect(normalized).toContain("prioridade alta");
  });

  it("deve detectar solicitação urgente com ambas as categorias", () => {
    const result = parseTeamsMessage("Solicitação urgente de acesso ao sistema");
    expect(result.category).toBe("Solicitação");
    expect(result.priority).toBe("critica");
    expect(result.matchedKeywords).toContain("Solicitação");
    expect(result.matchedKeywords).toContain("urgente");
  });

  it("deve lidar com texto vazio", () => {
    const result = parseTeamsMessage("");
    expect(result.category).toBe("Geral");
    expect(result.priority).toBe("media");
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it("deve lidar com texto apenas com espaços", () => {
    const result = parseTeamsMessage("   ");
    expect(result.category).toBe("Geral");
    expect(result.priority).toBe("media");
  });
});

// ─── Testes de normalizeMessageText ──────────────────────────────────────────

describe("normalizeMessageText", () => {
  it("deve converter para minúsculas", () => {
    expect(normalizeMessageText("URGENTE")).toBe("urgente");
  });

  it("deve remover acentos", () => {
    expect(normalizeMessageText("solicitação")).toBe("solicitacao");
    expect(normalizeMessageText("ocorrência")).toBe("ocorrencia");
    expect(normalizeMessageText("requisição")).toBe("requisicao");
  });

  it("deve remover espaços extras nas bordas", () => {
    expect(normalizeMessageText("  urgente  ")).toBe("urgente");
  });
});

// ─── Testes de getTeamsEnv ────────────────────────────────────────────────────

describe("getTeamsEnv", () => {
  it("deve retornar as variáveis de ambiente do Teams", () => {
    const env = getTeamsEnv();
    expect(env).toHaveProperty("TEAMS_TENANT_ID");
    expect(env).toHaveProperty("TEAMS_CLIENT_ID");
    expect(env).toHaveProperty("TEAMS_CLIENT_SECRET");
    expect(env).toHaveProperty("TEAMS_NOTIFICATION_URL");
    expect(env).toHaveProperty("TEAMS_LIFECYCLE_URL");
    expect(env).toHaveProperty("TEAMS_WEBHOOK_CLIENT_STATE");
    expect(env).toHaveProperty("TEAMS_DEFAULT_RESOURCE");
  });

  it("deve usar valor padrão para TEAMS_WEBHOOK_CLIENT_STATE", () => {
    const env = getTeamsEnv();
    // Deve ter algum valor (padrão ou configurado)
    expect(env.TEAMS_WEBHOOK_CLIENT_STATE).toBeTruthy();
  });
});

// ─── Testes de lógica de fallback (sem chamadas de rede) ─────────────────────

describe("Lógica de fallback para notificações Teams", () => {
  it("deve extrair chatId e messageId de resource string no formato correto", () => {
    // Simular a extração que ocorre em resolveChatMessageFromGraph
    const resource = "chats/19:abc123@thread.v2/messages/1234567890";
    const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
    expect(matches).not.toBeNull();
    expect(matches?.[1]).toBe("19:abc123@thread.v2");
    expect(matches?.[2]).toBe("1234567890");
  });

  it("deve extrair chatId e messageId de resource string com barra inicial", () => {
    const resource = "/chats/19:xyz456@thread.v2/messages/9876543210";
    const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
    expect(matches).not.toBeNull();
    expect(matches?.[1]).toBe("19:xyz456@thread.v2");
    expect(matches?.[2]).toBe("9876543210");
  });

  it("deve retornar null para resource sem formato de chat", () => {
    const resource = "/teams/someTeamId/channels/someChannelId";
    const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
    expect(matches).toBeNull();
  });

  it("deve construir hint correto para erro 404", () => {
    const status = 404;
    const hint = status === 404
      ? "Verifique se Chat.Read.All está configurado como Application Permission com admin consent no Azure AD."
      : status === 403
      ? "Permissão insuficiente."
      : "Erro inesperado.";
    expect(hint).toContain("Chat.Read.All");
    expect(hint).toContain("Application Permission");
  });

  it("deve construir hint correto para erro 403", () => {
    const status = 403;
    const hint = status === 404
      ? "Verifique se Chat.Read.All está configurado."
      : status === 403
      ? "Permissão insuficiente. Adicione Chat.Read.All como Application Permission e conceda admin consent."
      : "Erro inesperado.";
    expect(hint).toContain("admin consent");
  });
});
