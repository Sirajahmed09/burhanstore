import crypto from 'crypto';

// Secret retriever with development/preview fallback
function getSecret() {
  return process.env.JWT_SECRET || 'burhan-store-fallback-secret-2024-secure-token-key-v1';
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
      resolve(key === derivedKey.toString('hex'));
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
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    // Decode and check expiry
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);

    if (decodedPayload.exp && decodedPayload.exp < now) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
}
