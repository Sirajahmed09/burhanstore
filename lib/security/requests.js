export class RequestError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export async function readJsonBody(request, maxBytes = 65536) {
  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) throw new RequestError('JSON request required', 415);
  const origin = request.headers.get('origin');
  const allowed = new Set([new URL(request.url).origin, process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com']);
  if (origin && !allowed.has(origin)) throw new RequestError('Request origin not allowed', 403);
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RequestError('Request too large', 413);
  const reader = request.body?.getReader(); if (!reader) throw new RequestError('JSON body required');
  const chunks = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new RequestError('Request too large', 413); } chunks.push(value); } } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
  let body; try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new RequestError('Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError('JSON object required');
  const check = (value, depth = 0) => { if (depth > 12) throw new RequestError('Request nesting too deep'); if (!value || typeof value !== 'object') return; for (const key of Object.keys(value)) { if (key.startsWith('$') || ['__proto__', 'prototype', 'constructor'].includes(key) || key.includes('.')) throw new RequestError('Invalid request field'); check(value[key], depth + 1); } };
  check(body); return body;
}
export function clientAddress(request) { return (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 100); }
export function literalSearch(value) { return String(value || '').slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
