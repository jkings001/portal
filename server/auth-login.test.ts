import { describe, it, expect } from 'vitest';

const API_URL = 'http://localhost:3000';

// Use global fetch (available in Node.js 18+)
const fetchFn = typeof fetch !== 'undefined' ? fetch : globalThis.fetch;

describe('Authentication Login - Database Integration', () => {
  it('should login with valid admin credentials', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'jeferson.reis@jkings.com.br',
        password: 'Jkadm2010BlueCat',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('jeferson.reis@jkings.com.br');
    expect(data.user.role).toBe('admin');
    expect(data.token).toBeDefined();
  }, { timeout: 30000 });

  it('should reject invalid password', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'jeferson.reis@jkings.com.br',
        password: 'wrongpassword',
      }),
    });

    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    // O endpoint retorna {error: '...'} para credenciais inválidas
    expect(data.error || data.message || data.success === false).toBeTruthy();
  }, { timeout: 30000 });

  it('should reject non-existent user', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'Jkadm2010BlueCat',
      }),
    });

    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    // O endpoint retorna {error: '...'} para usuário inexistente
    expect(data.error || data.message || data.success === false).toBeTruthy();
  }, { timeout: 30000 });

  it('should set session cookie on successful login', async () => {
    // Verify that the session cookie is set alongside the JWT token in the response
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'jeferson.reis@jkings.com.br',
        password: 'Jkadm2010BlueCat',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    // Verify session cookie is set in response headers (for tRPC protectedProcedures)
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).not.toBeNull();
  }, { timeout: 30000 });
});
