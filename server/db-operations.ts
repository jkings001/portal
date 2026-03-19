/**
 * Database operations wrapper with automatic retry logic
 * Wraps critical database operations with retry and backoff
 */

import { retryIfRetryable, RetryOptions } from './retry';
import { getDb } from './db';

// Default retry options for database operations
const DEFAULT_DB_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Execute a database operation with automatic retry
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_DB_RETRY_OPTIONS
): Promise<T> {
  const result = await retryIfRetryable(operation, options);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  throw result.error || new Error('Database operation failed after retries');
}

/**
 * Execute a query with automatic retry
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  operationName: string = 'Query'
): Promise<T> {
  return executeWithRetry(
    async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }
      return queryFn();
    },
    {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
    }
  );
}

/**
 * Execute a mutation (insert/update/delete) with automatic retry
 */
export async function mutateWithRetry<T>(
  mutationFn: () => Promise<T>,
  operationName: string = 'Mutation'
): Promise<T> {
  return executeWithRetry(
    async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }
      return mutationFn();
    },
    {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
    }
  );
}
