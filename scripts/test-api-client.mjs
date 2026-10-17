import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load the browser-oriented ES module without changing the app's Next.js module setup.
const apiClientSource = await readFile(new URL('../lib/apiClient.js', import.meta.url), 'utf8');
const { apiFetch } = await import(`data:text/javascript,${encodeURIComponent(apiClientSource)}`);

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

try {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    assert.match(url, /_t=/, 'GET requests should be cache-busted');
    assert.equal(options.cache, 'no-store');
    if (calls === 1) return new Response(JSON.stringify({ error: 'busy' }), { status: 503 });
    return new Response(JSON.stringify({ success: true, value: 42 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const retryResult = await apiFetch('/api/example', { retryDelayMs: 0 });
  assert.deepEqual(retryResult, { success: true, value: 42 });
  assert.equal(calls, 2, 'transient GET failures should be retried');
  console.log('[PASS] retries transient GET failures');

  calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: 'rejected' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  };
  await assert.rejects(
    apiFetch('/api/write', { method: 'POST', body: '{}', retryDelayMs: 0 }),
    (error) => error.message === 'rejected' && error.status === 503,
  );
  assert.equal(calls, 1, 'unsafe POST requests should not be retried');
  console.log('[PASS] does not retry POST failures');

  globalThis.fetch = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  await assert.rejects(
    apiFetch('/api/slow', { timeoutMs: 1, retryDelayMs: 0 }),
    (error) => error.code === 'ETIMEDOUT',
  );
  console.log('[PASS] aborts requests that exceed the timeout');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
}
