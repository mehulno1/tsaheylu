/**
 * Admin role constants
 * These values match the backend database enum values
 */
export const ADMIN_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: string): role is AdminRole {
  return role === ADMIN_ROLES.ADMIN || role === ADMIN_ROLES.SUPERADMIN;
}
