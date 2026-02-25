import { useAuth } from '@/contexts/AuthContext'
import {
  hasMinRole,
  canManageUsers,
  canViewAllData,
  canManageCarteiras,
  canConfigOmie,
  type UserRole,
} from '@/lib/roles'

export function useRole() {
  const { role } = useAuth()

  return {
    role,
    isAdmin: role === 'admin',
    isGerente: role === 'gerente',
    isVendedor: role === 'vendedor',
    hasMinRole: (required: UserRole) => hasMinRole(role, required),
    canManageUsers: canManageUsers(role),
    canViewAllData: canViewAllData(role),
    canManageCarteiras: canManageCarteiras(role),
    canConfigOmie: canConfigOmie(role),
  }
}
