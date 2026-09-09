import { verifyToken } from './auth.js';

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  
  // Clean old attempts
  const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return { allowed: false, resetIn: RATE_LIMIT_WINDOW - (now - recentAttempts[0]) };
  }
  
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);
  
  return { allowed: true };
}

export function clearRateLimit(identifier) {
  loginAttempts.delete(identifier);
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
