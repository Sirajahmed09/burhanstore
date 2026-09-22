/**
 * RBAC (Role-Based Access Control) & Permissions Matrix for BURHAN STORE
 * 
 * Roles:
 * - owner (Founder / Superadmin, full unrestricted authority)
 * - manager (High-level manager, can manage catalog, orders, and view reports, but cannot delete products or approve employee changes)
 * - employee (Staff member, restricted operations, critical modifications trigger Approval Requests)
 */

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

// Canonical list of all system permissions
export const ALL_PERMISSIONS = [
  // Products
  'products:read',
  'products:create',
  'products:edit_details',
  'products:edit_price',
  'products:edit_stock',
  'products:toggle_status',
  'products:delete',

  // Categories
  'categories:read',
  'categories:create',
  'categories:edit',
  'categories:delete',

  // Orders
  'orders:read',
  'orders:update_status',
  'orders:delete',

  // Employee & Team Management
  'employees:read',
  'employees:create',
  'employees:edit',
  'employees:delete',
  'employees:reset_password',

  // Change Approval Workflow
  'approvals:read',
  'approvals:approve',
  'approvals:reject',

  // Audit Logs
  'audit:read',

  // Settings
  'settings:read',
  'settings:edit'
];

// Default permissions for each role
export const ROLE_DEFAULT_PERMISSIONS = {
  [ROLES.OWNER]: [
    ...ALL_PERMISSIONS
  ],
  [ROLES.MANAGER]: [
    'products:read',
    'products:create',
    'products:edit_details',
    'products:edit_price',
    'products:edit_stock',
    'products:toggle_status',
    'categories:read',
    'categories:create',
    'categories:edit',
    'orders:read',
    'orders:update_status',
    'audit:read',
    'settings:read'
  ],
  [ROLES.EMPLOYEE]: [
    'products:read',
    'products:create',
    'products:edit_details',
    'products:edit_price',
    'products:edit_stock',
    'categories:read',
    'orders:read',
    'orders:update_status'
  ]
};

/**
 * Actions performed by employees (and optionally managers) that require Owner Approval
 * before being committed into the main database.
 */
export const ACTIONS_REQUIRING_APPROVAL = [
  'PRODUCT_PRICE_CHANGE',
  'PRODUCT_STOCK_CHANGE',
  'PRODUCT_DELETE',
  'CATEGORY_DELETE',
  'ORDER_DELETE',
  'ORDER_CANCEL'
];

/**
 * Checks if a specific action by a given role requires approval.
 * Owners NEVER require approval.
 * Employees require approval for critical catalog/order actions.
 */
export function doesActionRequireApproval(role, actionType) {
  if (role === ROLES.OWNER || role === 'superadmin') {
    return false;
  }
  // Employees always require approval for critical operations
  if (role === ROLES.EMPLOYEE) {
    return ACTIONS_REQUIRING_APPROVAL.includes(actionType);
  }
  // Managers require approval for destructive deletions
  if (role === ROLES.MANAGER) {
    return ['PRODUCT_DELETE', 'CATEGORY_DELETE', 'ORDER_DELETE'].includes(actionType);
  }
  return true;
}

/**
 * Checks whether user has permission.
 * Owners have all permissions unconditionally.
 */
export function hasPermission(user, requiredPermission) {
  if (!user) return false;
  const role = user.role;
  if (role === ROLES.OWNER || role === 'superadmin') {
    return true;
  }

  // If user has custom permissions assigned, check them first
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(requiredPermission);
  }

  // Otherwise fallback to role defaults
  const rolePerms = ROLE_DEFAULT_PERMISSIONS[role] || [];
  return rolePerms.includes(requiredPermission);
}
