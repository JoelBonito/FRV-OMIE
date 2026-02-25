export type UserRole = 'admin' | 'gerente' | 'vendedor'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  gerente: 2,
  vendedor: 1,
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewAllData(role: UserRole): boolean {
  return role === 'admin' || role === 'gerente'
}

export function canManageCarteiras(role: UserRole): boolean {
  return role === 'admin' || role === 'gerente'
}

export function canConfigOmie(role: UserRole): boolean {
  return role === 'admin'
}
