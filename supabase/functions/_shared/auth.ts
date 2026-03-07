/**
 * Auth helpers for Edge Functions.
 * Validates JWT and checks user role.
 * Supports both user JWTs and service_role_key (for cron/automation).
 */

import { getSupabaseAdmin } from './supabase-admin.ts'

export interface AuthUser {
  userId: string
  role: string
}

/**
 * Extract and validate JWT from Authorization header.
 * Accepts user JWTs (from frontend) and service_role_key (from GitHub Actions/pg_cron).
 * Returns user info or throws.
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '')

  // Decode JWT payload to check role (works for both user and service_role tokens)
  const jwtRole = decodeJwtRole(token)

  // service_role = automation (GitHub Actions, pg_cron, direct service_role calls)
  if (jwtRole === 'service_role') {
    return { userId: 'service_role', role: 'admin' }
  }

  // For user tokens, validate via Supabase Auth
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

/**
 * Decode JWT payload without verification (role check only).
 * The Supabase gateway already validates the JWT signature.
 */
function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.role || null
  } catch {
    return null
  }
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}
