import { jwtVerify } from 'jose';

function secret() { const value = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '').trim(); return value ? new TextEncoder().encode(value) : null; }
export async function validAdminSession(token) {
  const key = secret(); if (!key || !token) return false;
  try { const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'], requiredClaims: ['exp', 'iat'] }); return typeof payload.id === 'string' && typeof payload.email === 'string'; } catch { return false; }
}
