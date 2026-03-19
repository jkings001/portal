import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  retryWithBackoff,
  retryIfRetryable,
  calculateBackoffDelay,
  sleep,
  isRetryableError,
} from './retry';

describe('Retry Logic', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const options = {
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitterFactor: 0,
      };

      const delay1 = calculateBackoffDelay(1, options);
      const delay2 = calculateBackoffDelay(2, options);
      const delay3 = calculateBackoffDelay(3, options);

      // Without jitter: 100, 200, 400
      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
      expect(delay3).toBe(400);
    });

    it('should cap delay at maxDelayMs', () => {
      const options = {
        maxAttempts: 10,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0,
      };

      const delay = calculateBackoffDelay(10, options);
      expect(delay).toBeLessThanOrEqual(1000);
    });

    it('should add jitter correctly', () => {
      const options = {
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitterFactor: 0.1,
      };

      const delay = calculateBackoffDelay(1, options);
      // With jitter: 100 + (100 * 0.1 * random) = 100-110
      expect(delay).toBeGreaterThanOrEqual(100);
      expect(delay).toBeLessThanOrEqual(110);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('isRetryableError', () => {
    it('should identify connection errors as retryable', () => {
      expect(isRetryableError(new Error('Connection lost'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('Server closed the connection'))).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      expect(isRetryableError(new Error('Timeout'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    });

    it('should identify MySQL connection errors as retryable', () => {
      const error = new Error('Lost connection to MySQL server');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify non-connection errors as retryable', () => {
      expect(isRetryableError(new Error('Invalid query'))).toBe(false);
      expect(isRetryableError(new Error('Syntax error'))).toBe(false);
      expect(isRetryableError(new Error('Access denied'))).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Persistent error');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should measure total time correctly', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 2,
        initialDelayMs: 50,
        maxDelayMs: 100,
        jitterFactor: 0,
      });

      expect(result.totalTimeMs).toBeGreaterThanOrEqual(40); // tolerância de 10ms para ambientes lentos
      expect(result.success).toBe(true);
    });
  });

  describe('retryIfRetryable', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce('success');

      const result = await retryIfRetryable(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail immediately on non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid query'));

      const result = await retryIfRetryable(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid query');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on timeout errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce('success');

      const result = await retryIfRetryable(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });
});
