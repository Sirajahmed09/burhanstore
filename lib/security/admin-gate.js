import { jwtVerify, SignJWT } from 'jose';
import { ADMIN_ENTRY_KEY_HASH } from './admin-entry-policy.js';
export function entryHash() { return process.env.ADMIN_ENTRY_KEY_HASH || ADMIN_ENTRY_KEY_HASH; }
function secret() { const value = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '').trim(); return value ? new TextEncoder().encode(value) : null; }
export async function validAdminSession(token) {
  const key = secret(); if (!key || !token) return false;
  try { const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'], requiredClaims: ['exp', 'iat'] }); return typeof payload.id === 'string' && typeof payload.email === 'string'; } catch { return false; }
}
export async function validEntryCookie(token) {
  const key = secret(); if (!key || !token) return false;
  try { const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'], issuer: 'burhan-staff-entry', audience: 'admin-login', requiredClaims: ['exp'] }); return payload.gate === entryHash(); } catch { return false; }
}
export async function createEntryCookie() {
  const key = secret(); if (!key) throw new Error('Staff access is unavailable');
  return new SignJWT({ gate: entryHash() }).setProtectedHeader({ alg: 'HS256' }).setIssuer('burhan-staff-entry').setAudience('admin-login').setIssuedAt().setExpirationTime('7d').sign(key);
}
export async function validEntryKey(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(value)) return false;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('') === entryHash();
}
