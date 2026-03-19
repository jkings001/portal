/**
 * Retry utility with exponential backoff
 * Provides configurable retry logic for database operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterFactor?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const exponentialDelay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1),
    options.maxDelayMs
  );

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * options.jitterFactor * Math.random();
  return exponentialDelay + jitter;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= mergedOptions.maxAttempts; attempt++) {
    try {
      const data = await fn();
      const totalTimeMs = Date.now() - startTime;
      return {
        success: true,
        data,
        attempts: attempt,
        totalTimeMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log attempt
      console.log(
        `[Retry] Attempt ${attempt}/${mergedOptions.maxAttempts} failed:`,
        lastError.message
      );

      // Don't delay after last attempt
      if (attempt < mergedOptions.maxAttempts) {
        const delayMs = calculateBackoffDelay(attempt, mergedOptions);
        console.log(`[Retry] Waiting ${delayMs.toFixed(0)}ms before retry...`);
        await sleep(delayMs);
      }
    }
  }

  const totalTimeMs = Date.now() - startTime;
  return {
    success: false,
    error: lastError,
    attempts: mergedOptions.maxAttempts,
    totalTimeMs,
  };
}

/**
 * Check if error is retryable (connection errors, timeouts)
 */
export function isRetryableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code?.toLowerCase() || '';

  // Connection errors
  if (message.includes('connection') || message.includes('econnrefused')) {
    return true;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('etimedout')) {
    return true;
  }

  // MySQL specific errors
  if (code === 'er_query_interrupted' || code === 'er_connection_killed') {
    return true;
  }

  // Lost connection
  if (message.includes('lost connection') || message.includes('server closed')) {
    return true;
  }

  return false;
}

/**
 * Retry only if error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= mergedOptions.maxAttempts; attempt++) {
    try {
      const data = await fn();
      const totalTimeMs = Date.now() - startTime;
      return {
        success: true,
        data,
        attempts: attempt,
        totalTimeMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log('[Retry] Error is not retryable, failing immediately:', lastError.message);
        const totalTimeMs = Date.now() - startTime;
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs,
        };
      }

      console.log(
        `[Retry] Attempt ${attempt}/${mergedOptions.maxAttempts} failed (retryable):`,
        lastError.message
      );

      // Don't delay after last attempt
      if (attempt < mergedOptions.maxAttempts) {
        const delayMs = calculateBackoffDelay(attempt, mergedOptions);
        console.log(`[Retry] Waiting ${delayMs.toFixed(0)}ms before retry...`);
        await sleep(delayMs);
      }
    }
  }

  const totalTimeMs = Date.now() - startTime;
  return {
    success: false,
    error: lastError,
    attempts: mergedOptions.maxAttempts,
    totalTimeMs,
  };
}
