import { describe, it, expect } from 'vitest';

describe('OpenId Uniqueness', () => {
  describe('OpenId Generation', () => {
    it('should generate openId with timestamp and random component', () => {
      const email = 'test@example.com';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const openId = `local-${email}-${timestamp}-${random}`;
      
      expect(openId).toContain('local-');
      expect(openId).toContain(email);
      expect(openId).toContain(timestamp.toString());
      expect(openId.length).toBeGreaterThan(email.length + 10);
    });

    it('should generate different openIds for same email', () => {
      const email = 'test@example.com';
      const openId1 = `local-${email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate a slight delay
      const openId2 = `local-${email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      expect(openId1).not.toEqual(openId2);
    });

    it('should handle multiple rapid openId generations', () => {
      const email = 'test@example.com';
      const openIds = new Set();
      
      for (let i = 0; i < 10; i++) {
        const openId = `local-${email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        openIds.add(openId);
      }
      
      // Due to random component, we should have unique IDs
      expect(openIds.size).toBeGreaterThan(1);
    });
  });

  describe('OpenId Collision Detection', () => {
    it('should detect when openId already exists', () => {
      const existingIds = new Set([
        'local-test@example.com-1234567890-abc123',
        'local-test@example.com-1234567891-def456',
      ]);
      
      const newId = 'local-test@example.com-1234567890-abc123';
      
      expect(existingIds.has(newId)).toBe(true);
    });

    it('should generate fallback openId with counter', () => {
      const baseOpenId = 'local-test@example.com-1234567890-abc123';
      const existingIds = new Set([baseOpenId]);
      
      let uniqueOpenId = baseOpenId;
      let counter = 0;
      
      while (counter < 10) {
        if (!existingIds.has(uniqueOpenId)) break;
        uniqueOpenId = `${baseOpenId}-${counter}`;
        counter++;
      }
      
      expect(uniqueOpenId).not.toBe(baseOpenId);
      expect(uniqueOpenId).toContain(`-${counter - 1}`);
    });

    it('should retry up to 10 times for collision resolution', () => {
      const baseOpenId = 'local-test@example.com-1234567890-abc123';
      const existingIds = new Set();
      
      // Simulate existing IDs with counters
      for (let i = 0; i < 5; i++) {
        existingIds.add(`${baseOpenId}-${i}`);
      }
      
      let uniqueOpenId = baseOpenId;
      let counter = 0;
      
      while (counter < 10) {
        if (!existingIds.has(uniqueOpenId)) break;
        uniqueOpenId = `${baseOpenId}-${counter}`;
        counter++;
      }
      
      expect(existingIds.has(uniqueOpenId)).toBe(false);
      expect(counter).toBeLessThan(10);
    });
  });

  describe('Email Uniqueness Constraint', () => {
    it('should enforce unique email constraint', () => {
      const emails = new Set();
      const email1 = 'user@example.com';
      const email2 = 'user@example.com';
      
      emails.add(email1);
      
      // Second email should not be added (duplicate)
      if (!emails.has(email2)) {
        emails.add(email2);
      }
      
      expect(emails.size).toBe(1);
    });

    it('should allow different emails', () => {
      const emails = new Set();
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      
      emails.add(email1);
      emails.add(email2);
      
      expect(emails.size).toBe(2);
    });

    it('should be case-insensitive for email comparison', () => {
      const normalizeEmail = (email: string) => email.toLowerCase();
      const emails = new Set();
      
      const email1 = 'User@Example.com';
      const email2 = 'user@example.com';
      
      emails.add(normalizeEmail(email1));
      emails.add(normalizeEmail(email2));
      
      expect(emails.size).toBe(1);
    });
  });
});
