/**
 * Shared Omie API client for Edge Functions.
 * Handles authentication, pagination, rate limiting, and error handling.
 */

const OMIE_BASE_URL = 'https://app.omie.com.br/api/v1'

export interface OmieCredentials {
  app_key: string
  app_secret: string
}

export interface OmieRequestParams {
  endpoint: string       // e.g. "geral/clientes"
  call: string           // e.g. "ListarClientes"
  params: Record<string, unknown>
}

export interface OmieResponse<T = unknown> {
  data: T
  status: 'success' | 'error'
  duration_ms: number
  error?: string
}

export interface OmiePaginatedResult<T> {
  pagina: number
  total_de_paginas: number
  registros: number
  total_de_registros: number
  items: T[]
}

/**
 * Single API call to Omie (JSON-RPC via POST).
 */
export async function omieCall<T = unknown>(
  credentials: OmieCredentials,
  request: OmieRequestParams,
): Promise<OmieResponse<T>> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${OMIE_BASE_URL}/${request.endpoint}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: credentials.app_key,
        app_secret: credentials.app_secret,
        call: request.call,
        param: [request.params],
      }),
    })

    const data = await response.json() as T & { faultstring?: string; faultcode?: string }
    const duration_ms = Date.now() - startTime

    // Omie returns 200 even on errors, check faultstring
    if (data && typeof data === 'object' && 'faultstring' in data) {
      return {
        data,
        status: 'error',
        duration_ms,
        error: `${(data as Record<string, unknown>).faultcode}: ${(data as Record<string, unknown>).faultstring}`,
      }
    }

    return { data, status: 'success', duration_ms }
  } catch (err) {
    return {
      data: {} as T,
      status: 'error',
      duration_ms: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Fetch ALL pages from a paginated Omie endpoint.
 * Automatically handles pagination and rate limiting (sleep between pages).
 */
export async function omieFetchAll<TItem>(
  credentials: OmieCredentials,
  endpoint: string,
  call: string,
  resultKey: string,
  extraParams: Record<string, unknown> = {},
  registrosPorPagina = 50,
): Promise<{ items: TItem[]; totalRegistros: number; pages: number; errors: string[] }> {
  const items: TItem[] = []
  const errors: string[] = []
  let pagina = 1
  let totalPages = 1

  while (pagina <= totalPages) {
    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint,
      call,
      params: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        ...extraParams,
      },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    const data = result.data
    totalPages = (data.total_de_paginas as number) || 1
    const pageItems = (data[resultKey] as TItem[]) || []
    items.push(...pageItems)

    pagina++

    // Rate limit: max 4 req/sec → sleep 300ms between pages
    if (pagina <= totalPages) {
      await sleep(300)
    }
  }

  return {
    items,
    totalRegistros: items.length,
    pages: totalPages,
    errors,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ----------------------------------------------------------------
// Tag → tipo mapping for clients
// ----------------------------------------------------------------
const TAG_TO_TIPO: Record<string, string> = {
  'SINDICO': 'sindico',
  'EMPRESAS': 'empresa',
  'CONSUMIDOR FINAL': 'consumidor_final',
}

// Tags that indicate administradora (management company names)
const ADMIN_TAGS = new Set([
  'CONFIANÇA', 'CONDONAL', 'CONDO27', 'CONTACEL', 'MGM',
  'RGA', 'CECAD', 'PRATICA', 'JBR GESTAO', 'SENA',
  'PREMIER', 'INOVA', 'CONVIVA',
])

/**
 * Determine client type from Omie tags.
 * Priority: explicit tipo tag > admin tag > default 'empresa'.
 */
export function resolveClientType(tags: Array<{ tag: string }>): string {
  for (const { tag } of tags) {
    const upper = tag.toUpperCase().trim()
    if (TAG_TO_TIPO[upper]) return TAG_TO_TIPO[upper]
  }

  for (const { tag } of tags) {
    const upper = tag.toUpperCase().trim()
    if (ADMIN_TAGS.has(upper)) return 'administradora'
  }

  // Default for business clients
  return 'empresa'
}
