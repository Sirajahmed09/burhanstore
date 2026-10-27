import { RequestError } from './requests.js';
export async function verifyHumanCheck(token, options = {}) {
  const env = options.env || process.env;
  if (!env.TURNSTILE_SECRET_KEY) return;
  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) throw new RequestError('Security verification is temporarily unavailable', 503);
  if (typeof token !== 'string' || !token || token.length > 2048) throw new RequestError('Please complete the security check', 403);
  let result;
  try {
    const response = await (options.fetchImpl || fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Unavailable');
    result = await response.json();
  } catch { throw new RequestError('Security verification is temporarily unavailable. Please try again.', 503); }
  const expectedHost = new URL(env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com').hostname;
  if (result.success !== true || result.hostname !== expectedHost || result.action !== 'checkout') throw new RequestError('Security check expired or failed. Please try again.', 403);
}
