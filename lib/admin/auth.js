import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const UNIFIED_JWT_SECRET = 'burhan-store-production-admin-jwt-secret-key-2026-auth-32bytes';

// Secret retriever with deterministic cross-serverless synchronization
export function getSecret() {
  const envSecret = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '').trim();
  if (envSecret) {
    return envSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin JWT secret is not configured. Set ADMIN_JWT_SECRET or JWT_SECRET in production.');
  }

  // Development-only fallback. Production must fail closed rather than use a source-controlled secret.
  return UNIFIED_JWT_SECRET;
}

export async function hashPassword(password) {
  try {
    const bcrypt = await import('bcryptjs');
    const hashFn = bcrypt.hash || bcrypt.default?.hash || bcrypt.default;
    if (typeof hashFn === 'function') {
      return await hashFn(password, 10);
    }
  } catch (err) {
    console.warn('bcryptjs fallback to scrypt:', err?.message);
  }

  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function verifyPassword(password, hash) {
  if (!hash || !password) return false;

  // Support bcrypt hashes ($2a$, $2b$, $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      const bcrypt = await import('bcryptjs');
      const compareFn = bcrypt.compare || bcrypt.default?.compare || bcrypt.default;
      if (typeof compareFn === 'function') {
        return await compareFn(password, hash);
      }
    } catch (err) {
      console.error('Bcrypt compare error:', err?.message);
    }
  }

  // Support scrypt hashes (salt:hash)
  return new Promise((resolve) => {
    const parts = hash.split(':');
    if (parts.length !== 2) return resolve(false);
    const [salt, key] = parts;
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try { const expected = Buffer.from(key, 'hex'); resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey)); } catch { resolve(false); }
    });
  });
}

export async function createToken(payload, expiresIn = '7d') {
  try {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (7 * 24 * 60 * 60); // 7 days

    const tokenPayload = {
      ...payload,
      iat: now,
      exp: exp
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', getSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (err) {
    console.error('Error creating token:', err);
    throw new Error('Failed to generate session token');
  }
}

export async function verifyToken(token) {
  if (typeof token !== 'string' || token.length > 8192) return null;
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, new TextEncoder().encode(getSecret()), { algorithms: ['HS256'], requiredClaims: ['exp', 'iat'] });
    if (typeof payload.id !== 'string' || typeof payload.email !== 'string') return null;
    return payload;
  } catch { return null; }
}
