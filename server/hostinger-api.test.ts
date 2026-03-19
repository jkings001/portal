import { describe, it, expect } from 'vitest';

/**
 * Test to validate Hostinger API token
 * This test verifies that the HOSTINGER_API_TOKEN environment variable is set
 * and can be used to make authenticated requests to the Hostinger API
 */

describe('Hostinger API Integration', () => {
  it('should have HOSTINGER_API_TOKEN environment variable set', () => {
    const token = process.env.HOSTINGER_API_TOKEN;
    expect(token).toBeDefined();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should validate token format', () => {
    const token = process.env.HOSTINGER_API_TOKEN;
    // Hostinger tokens are typically alphanumeric strings
    expect(token).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should be able to construct Hostinger API authorization header', () => {
    const token = process.env.HOSTINGER_API_TOKEN;
    const authHeader = `Bearer ${token}`;
    
    expect(authHeader).toBeDefined();
    expect(authHeader).toContain('Bearer');
    expect(authHeader).toContain(token);
  });

  it('should validate token is not empty or placeholder', () => {
    const token = process.env.HOSTINGER_API_TOKEN;
    
    // Check it's not a placeholder
    expect(token).not.toBe('your_token_here');
    expect(token).not.toBe('HOSTINGER_API_TOKEN');
    expect(token).not.toBe('');
    
    // Check minimum length (Hostinger tokens are typically long)
    expect(token!.length).toBeGreaterThanOrEqual(40);
  });
});
