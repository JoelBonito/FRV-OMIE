import type { ReactNode } from 'react'
import { useRole } from '@/hooks/useRole'
import type { UserRole } from '@/lib/roles'

interface RoleGuardProps {
  requiredRole: UserRole
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { hasMinRole } = useRole()

  if (!hasMinRole(requiredRole)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-semibold">Acesso Restrito</h3>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
