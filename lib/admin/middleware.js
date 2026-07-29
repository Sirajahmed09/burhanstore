import { verifyToken } from './auth';

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
