/**
 * Dynamic CORS handler for Edge Functions.
 * Reads allowed origins from ALLOWED_ORIGINS env var.
 */

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean)

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''

  // If no origins configured, allow all (dev mode)
  if (ALLOWED_ORIGINS.length === 0) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  }

  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

/**
 * CORS headers for webhook (accepts requests without Origin header when authenticated via secret)
 */
export function getWebhookCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')

  // No origin = server-to-server call (Omie webhook) — allow
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  }

  // Browser origin = check allowed list
  const headers = getCorsHeaders(req)
  headers['Access-Control-Allow-Headers'] = 'authorization, x-client-info, apikey, content-type, x-webhook-secret'
  return headers
}
