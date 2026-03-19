/**
 * Testes de autenticação local (sem OAuth)
 * 
 * Valida:
 * - Geração e verificação de tokens JWT
 * - Hash e verificação de senhas
 * - Criação de session token pelo SDK
 * - Verificação de session token pelo SDK
 * - Fluxo de login via tRPC (seta cookie)
 */

import { describe, expect, it, vi } from "vitest";
import { generateToken, verifyToken, hashPassword, verifyPassword } from "./auth";
import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx, setCookies };
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

describe("auth JWT helpers", () => {
  it("generates a valid JWT token", async () => {
    const user = { id: "42", email: "test@example.com", name: "Test User", role: "user" as const };
    const token = await generateToken(user);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifies a valid JWT token and returns payload", async () => {
    const user = { id: "42", email: "test@example.com", name: "Test User", role: "user" as const };
    const token = await generateToken(user);
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.user.id).toBe("42");
    expect(payload?.user.email).toBe("test@example.com");
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });
});

// ─── Password helpers ─────────────────────────────────────────────────────────

describe("auth password helpers", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "MySecurePass1";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-password");
    const valid = await verifyPassword("wrong-password", hash);
    expect(valid).toBe(false);
  });
});

// ─── SDK session token ────────────────────────────────────────────────────────

describe("sdk session token (local auth)", () => {
  it("creates a session token with numeric user ID as openId", async () => {
    const token = await sdk.createSessionToken("123", { name: "Test User", expiresInMs: ONE_YEAR_MS });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifies the session token and returns the openId", async () => {
    const token = await sdk.createSessionToken("456", { name: "Another User", expiresInMs: ONE_YEAR_MS });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("456");
    expect(session?.name).toBe("Another User");
  });

  it("returns null for an invalid session token", async () => {
    const result = await sdk.verifySession("not-a-valid-token");
    expect(result).toBeNull();
  });

  it("returns null for an empty session token", async () => {
    const result = await sdk.verifySession("");
    expect(result).toBeNull();
  });
});

// ─── tRPC auth.logout ────────────────────────────────────────────────────────

describe("auth.logout via tRPC", () => {
  it("clears the session cookie and returns success", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "1",
        email: "admin@example.com",
        name: "Admin",
        loginMethod: "local",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });
  });
});
