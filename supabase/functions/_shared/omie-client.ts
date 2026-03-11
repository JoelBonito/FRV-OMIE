/**
 * Shared Omie API client for Edge Functions.
 * Handles authentication, pagination, rate limiting, retry/backoff, and error handling.
 */

const OMIE_BASE_URL = 'https://app.omie.com.br/api/v1'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500
const PAGE_SLEEP_MS = 800  // 800ms between pages (was 400ms — Omie rate limits aggressively)
const RATE_LIMIT_DELAY_MS = 4000  // 4s backoff when Omie returns "chave inválida" (disguised rate limit)

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
 * Single API call to Omie (JSON-RPC via POST) with retry and exponential backoff.
 * Retries on: HTTP 429, network errors, Omie SOAP faults with timeout.
 */
export async function omieCall<T = unknown>(
  credentials: OmieCredentials,
  request: OmieRequestParams,
): Promise<OmieResponse<T>> {
  let lastError: string | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 200
      await sleep(delay)
    }

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

      // Rate limit: retry on 429 with standard backoff
      if (response.status === 429) {
        lastError = `Rate limit (429)`
        continue
      }

      // HTTP 500: parse body to distinguish rate limit from real errors
      if (response.status === 500) {
        let body500: Record<string, unknown> = {}
        try { body500 = await response.json() } catch { /* ignore parse error */ }
        const errMsg = String(body500.result || body500.faultstring || '')

        // "Chave de acesso inválida" on 500 = Omie disguised rate limit
        if (errMsg.toLowerCase().includes('chave de acesso')) {
          lastError = `Rate limit disguised as auth error: ${errMsg}`
          // Longer backoff for this specific case
          await sleep(RATE_LIMIT_DELAY_MS)
          continue
        }

        // "Não existem registros" (code 5113) = empty result, not an error
        if (errMsg.toLowerCase().includes('existem registros')) {
          return { data: body500 as T, status: 'success', duration_ms: Date.now() - startTime }
        }

        // "Consumo redundante" — extract and respect the wait time
        const redundantMatch = errMsg.match(/aguarde\s+(\d+)\s+segundos/i)
        if (redundantMatch) {
          const waitSecs = parseInt(redundantMatch[1])
          lastError = `Server error (500): ${errMsg}`
          await sleep(Math.min(waitSecs * 1000, 60000))
          continue
        }

        // Other 500s: retry with standard backoff
        lastError = `Server error (500): ${errMsg || 'unknown'}`
        continue
      }

      const data = await response.json() as T & { faultstring?: string; faultcode?: string }
      const duration_ms = Date.now() - startTime

      // Omie returns 200 even on errors, check faultstring
      if (data && typeof data === 'object' && 'faultstring' in data) {
        const faultCode = String((data as Record<string, unknown>).faultcode || '')
        const faultString = String((data as Record<string, unknown>).faultstring || '')

        // "Chave inválida" on 200 = also possible rate limit
        if (faultString.toLowerCase().includes('chave de acesso')) {
          lastError = `Rate limit (200): ${faultString}`
          await sleep(RATE_LIMIT_DELAY_MS)
          continue
        }

        // Transient errors that should be retried
        if (faultCode.includes('SOAP-ENV') || faultString.toLowerCase().includes('timeout')) {
          lastError = `${faultCode}: ${faultString}`
          continue
        }

        // Non-transient Omie error — don't retry
        return {
          data,
          status: 'error',
          duration_ms,
          error: `${faultCode}: ${faultString}`,
        }
      }

      return { data, status: 'success', duration_ms }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      if (attempt === MAX_RETRIES) {
        return {
          data: {} as T,
          status: 'error',
          duration_ms: Date.now() - startTime,
          error: `After ${MAX_RETRIES} retries: ${lastError}`,
        }
      }
    }
  }

  return { data: {} as T, status: 'error', duration_ms: 0, error: lastError || 'Max retries exceeded' }
}

/**
 * Fetch ALL pages from a paginated Omie endpoint.
 * Automatically handles pagination and rate limiting (sleep between pages).
 * On page error: retries via omieCall internally, then continues to next page.
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

    // Rate limit: ~400ms between pages (240 req/min = safe margin)
    if (pagina <= totalPages) {
      await sleep(PAGE_SLEEP_MS)
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
// Tag -> tipo mapping for clients
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

export interface ClientTypeInfo {
  tipo: string
  administradora: string | null
}

// ----------------------------------------------------------------
// Omie Pedido types (ListarPedidos response)
// ----------------------------------------------------------------
export interface OmiePedidoCabecalho {
  codigo_pedido: number
  numero_pedido?: string
  codigo_pedido_integracao?: string
  codigo_cliente: number
  codigo_vendedor?: number
  data_previsao?: string  // DD/MM/YYYY
  etapa?: string
  codigo_parcela?: string
  quantidade_itens?: number
}

export interface OmiePedidoInfoCadastro {
  dInc?: string   // DD/MM/YYYY
  hInc?: string
  dAlt?: string
  hAlt?: string
  cEtapa?: string
}

export interface OmiePedidoItem {
  produto?: {
    codigo_produto?: number
    descricao?: string
    quantidade?: number
    valor_unitario?: number
    valor_total?: number
    unidade?: string
    codigo?: string
  }
}

export interface OmiePedidoTotalPedido {
  valor_total_pedido?: number
  valor_mercadorias?: number
}

export interface OmiePedidoFrete {
  previsao_entrega?: string  // DD/MM/YYYY
}

export interface OmiePedidoRaw {
  cabecalho: OmiePedidoCabecalho
  det?: OmiePedidoItem[]
  infoCadastro?: OmiePedidoInfoCadastro
  total_pedido?: OmiePedidoTotalPedido
  frete?: OmiePedidoFrete
  observacoes?: { obs_venda?: string }
}

/**
 * Determine client type from Omie tags.
 * Priority: explicit tipo tag > admin tag > default 'empresa'.
 */
export function resolveClientType(tags: Array<{ tag: string }>): string {
  return resolveClientInfo(tags).tipo
}

/**
 * Resolve both tipo and administradora name from Omie tags.
 * When a client has an admin tag (e.g. CONDONAL), returns:
 *   { tipo: 'administradora', administradora: 'CONDONAL' }
 */
export function resolveClientInfo(tags: Array<{ tag: string }>): ClientTypeInfo {
  for (const { tag } of tags) {
    const upper = tag.toUpperCase().trim()
    if (TAG_TO_TIPO[upper]) return { tipo: TAG_TO_TIPO[upper], administradora: null }
  }

  for (const { tag } of tags) {
    const upper = tag.toUpperCase().trim()
    if (ADMIN_TAGS.has(upper)) return { tipo: 'administradora', administradora: upper }
  }

  return { tipo: 'empresa', administradora: null }
}
