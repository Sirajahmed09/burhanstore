import { verifyToken } from './auth.js';

// In-memory rate limiter for failed login attempts
// Maps identifier (e.g. IP or email) -> Array of failed attempt timestamps
const failedAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes lockout window
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Checks if the identifier is currently locked out due to too many failed attempts
 */
export function isRateLimited(identifier) {
  if (!identifier) return { locked: false };
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const timestamps = failedAttempts.get(key) || [];

  // Filter out attempts older than the window
  const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  failedAttempts.set(key, recent);

  if (recent.length >= MAX_FAILED_ATTEMPTS) {
    const oldest = recent[0];
    const resetIn = RATE_LIMIT_WINDOW - (now - oldest);
    return { locked: true, resetIn: Math.max(resetIn, 1000) };
  }

  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - recent.length };
}

/**
 * Records a failed login attempt
 */
export function recordFailedAttempt(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const timestamps = failedAttempts.get(key) || [];
  const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  failedAttempts.set(key, recent);
}

/**
 * Clears failed login attempts on successful authentication
 */
export function clearRateLimit(identifier) {
  if (!identifier) return;
  failedAttempts.delete(identifier.toLowerCase().trim());
}

/**
 * Backwards-compatibility wrapper
 */
export function checkRateLimit(identifier) {
  const status = isRateLimited(identifier);
  if (status.locked) {
    return { allowed: false, resetIn: status.resetIn };
  }
  return { allowed: true };
}

export async function requireAuth(request) {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return { authenticated: false, user: null };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return { authenticated: false, user: null };
  }

  return { authenticated: true, user: payload };
}

export async function requireRole(request, role) {
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return { authorized: false, user: null };
  }

  const roles = ['staff', 'manager', 'admin', 'superadmin'];
  const userRoleIndex = roles.indexOf(auth.user.role);
  const requiredRoleIndex = roles.indexOf(role);

  if (userRoleIndex < requiredRoleIndex) {
    return { authorized: false, user: auth.user };
  }

  return { authorized: true, user: auth.user };
}
