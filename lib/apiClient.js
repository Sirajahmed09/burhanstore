/**
 * Reliable Client-Side API Utility for Burhan Store
 * - Forces cache-busting (no-store, no-cache, timestamp)
 * - Safely handles non-JSON / HTML error responses (prevents "Unexpected token '<'")
 * - Retries transient failures for idempotent requests only
 * - Aborts requests that exceed the timeout without swallowing caller cancellation
 * - Strictly validates server response and database operation success
 */

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const isRetryableMethod = (method) =>
  method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

const wait = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

const retryDelay = (baseDelayMs, attempt) => baseDelayMs * (2 ** attempt);

const createAbortError = (message) => {
  const error = new Error(message);
  error.name = 'AbortError';
  error.code = 'ETIMEDOUT';
  return error;
};

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    signal: callerSignal,
    ...fetchOptions
  } = options;
  const maxRetries = isRetryableMethod(method) ? Math.max(0, retries) : 0;
  
  // Cache busting: append timestamp to GET requests to guarantee zero stale cache
  let finalUrl = url;
  if (method === 'GET') {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}_t=${Date.now()}`;
  }

  const defaultHeaders = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId;
    let removeCallerAbortListener;

    if (callerSignal?.aborted) {
      throw callerSignal.reason || createAbortError('The request was cancelled');
    }

    if (controller) {
      timeoutId = setTimeout(() => controller.abort(createAbortError(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
      if (callerSignal) {
        const abortCallerRequest = () => controller.abort(callerSignal.reason);
        callerSignal.addEventListener('abort', abortCallerRequest, { once: true });
        removeCallerAbortListener = () => callerSignal.removeEventListener('abort', abortCallerRequest);
      }
    }

    try {
      res = await fetch(finalUrl, {
        ...fetchOptions,
        cache: 'no-store',
        headers: mergedHeaders,
        ...(controller ? { signal: controller.signal } : { signal: callerSignal }),
      });
    } catch (networkErr) {
      const cancelled = callerSignal?.aborted;
      const timedOut = networkErr?.name === 'AbortError' && !cancelled;
      if (attempt < maxRetries && !cancelled) {
        await wait(retryDelay(retryDelayMs, attempt));
        continue;
      }
      if (timedOut) throw networkErr;
      throw new Error(`Network error: ${networkErr.message || 'Unable to connect to server'}`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      removeCallerAbortListener?.();
    }

    if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt >= maxRetries) break;
    await wait(retryDelay(retryDelayMs, attempt));
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('Failed to parse JSON response:', parseErr);
      data = null;
    }
  } else {
    // Received HTML or plain text (e.g. Next.js 404/500 error page or redirect)
    const rawText = await res.text().catch(() => '');
    const cleanText = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    
    if (!res.ok) {
      throw new Error(cleanText || `Server returned HTML error (${res.status})`);
    }
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  if (data && data.success === false) {
    const msg = data.error || data.message || 'Database operation was rejected by server';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const apiGet = (url, headers = {}) => apiFetch(url, { method: 'GET', headers });

export const apiPost = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiPut = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'PUT',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiPatch = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'PATCH',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiDelete = (url, headers = {}) =>
  apiFetch(url, {
    method: 'DELETE',
    headers,
  });
