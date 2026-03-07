/**
 * Auth helpers for Edge Functions.
 * Validates JWT and checks user role.
 */

import { getSupabaseAdmin } from './supabase-admin.ts'

export interface AuthUser {
  userId: string
  role: string
}

/**
 * Extract and validate JWT from Authorization header.
 * Returns user info or throws.
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseAdmin()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  const role = (user.user_metadata?.user_role as string) || 'vendedor'
  return { userId: user.id, role }
}

/**
 * Check if user has one of the allowed roles. Throws 403 if not.
 */
export function requireRole(user: AuthUser, allowed: string[]): void {
  if (!allowed.includes(user.role)) {
    throw new AuthError(`Role '${user.role}' not authorized. Required: ${allowed.join(', ')}`, 403)
  }
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}
