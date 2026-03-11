/**
 * Edge Function: omie-sync
 *
 * Syncs vendedores, clients and sales from Omie to Supabase.
 * Supports two modes:
 *   - "incremental" (default): only fetches records modified/created since last sync
 *   - "full": re-fetches everything (for reconciliation or initial load)
 *
 * POST /functions/v1/omie-sync
 * Body: { type, mode?, maxPages?, dateFrom?, dateTo? }
 *   type: "full" | "vendedores" | "clientes" | "vendas"
 *   mode: "incremental" | "full" (default: "incremental")
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { omieCall, resolveClientInfo, type OmieCredentials, type OmiePedidoRaw } from '../_shared/omie-client.ts'
import {
  getSupabaseAdmin,
  getOmieCredentials,
  logSync,
} from '../_shared/supabase-admin.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, requireRole, AuthError } from '../_shared/auth.ts'

const PAGE_SIZE = 200  // Max per page to reduce API calls
const PAGE_DELAY_MS = 600  // Delay between pages to avoid Omie rate limit

// ----------------------------------------------------------------
// Omie raw types
// ----------------------------------------------------------------
interface OmieVendedor {
  codigo: number
  codInt?: string
  nome: string
  email?: string
  inativo: string  // "S" | "N"
  comissao?: number
}

interface OmieCliente {
  codigo_cliente_omie: number
  razao_social: string
  nome_fantasia: string
  cnpj_cpf: string
  telefone1_ddd: string
  telefone1_numero: string
  email: string
  inativo: string
  pessoa_fisica: string
  tags: Array<{ tag: string }>
  recomendacoes?: {
    codigo_vendedor?: number
    numero_parcelas?: string
    email_fatura?: string
  }
}

interface OmieContaReceber {
  codigo_lancamento_omie: number
  codigo_cliente_fornecedor: number
  codigo_vendedor?: number
  valor_documento: number
  data_vencimento: string
  data_registro: string
  status_titulo: string
  numero_documento: string
  observacao?: string
  categorias?: Array<{ codigo_categoria: string; valor: number }>
}

// ----------------------------------------------------------------
// Sync Vendedores — from /geral/vendedores/ → ListarVendedores
// ----------------------------------------------------------------
async function syncVendedores(
  credentials: OmieCredentials,
  maxPages = 10,
): Promise<{ criados: number; atualizados: number; processados: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  // Pre-load existing vendedores for name-based reconciliation
  // Handles seeded vendedores (no omie_id) being matched to Omie vendedores
  const { data: existingVendedores } = await supabase
    .from('vendedores')
    .select('id, nome, omie_id')

  const nameToId = new Map<string, string>()
  const existingOmieIds = new Set<number>()
  for (const v of existingVendedores || []) {
    if (!v.omie_id) {
      nameToId.set(v.nome.toLowerCase().trim(), v.id)
    } else {
      existingOmieIds.add(v.omie_id)
    }
  }

  let pagina = 1
  let totalPages = 1
  let criados = 0
  let atualizados = 0
  let processados = 0
  const errors: string[] = []

  while (pagina <= Math.min(totalPages, maxPages)) {
    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint: 'geral/vendedores',
      call: 'ListarVendedores',
      params: { pagina, registros_por_pagina: PAGE_SIZE },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.cadastro as OmieVendedor[]) || []

    if (items.length === 0) {
      pagina++
      continue
    }

    // Step 1: Reconcile seeded vendedores by name (set their omie_id)
    for (const v of items) {
      const matchKey = v.nome.toLowerCase().trim()
      const existingId = nameToId.get(matchKey)
      if (existingId) {
        const { error } = await supabase
          .from('vendedores')
          .update({
            omie_id: v.codigo,
            email: v.email || null,
            status: v.inativo === 'S' ? 'inativo' as const : 'ativo' as const,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId)

        if (!error) {
          atualizados++
          existingOmieIds.add(v.codigo)
        }
        nameToId.delete(matchKey)
      }
    }

    // Step 2: Upsert all vendedores by omie_id
    const records = items.map((v) => ({
      omie_id: v.codigo,
      nome: v.nome,
      email: v.email || null,
      status: v.inativo === 'S' ? 'inativo' as const : 'ativo' as const,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('vendedores')
      .upsert(records, { onConflict: 'omie_id' })

    if (error) {
      errors.push(`Upsert vendedores page ${pagina}: ${error.message}`)
    } else {
      processados += records.length
      // Count truly new records (omie_id not seen before)
      for (const v of items) {
        if (!existingOmieIds.has(v.codigo)) {
          criados++
          existingOmieIds.add(v.codigo)
        }
      }
    }

    pagina++

    if (pagina <= totalPages) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  }

  return { criados, atualizados, processados, errors }
}

// ----------------------------------------------------------------
// Sync Clients — page by page with bulk upsert
// Links clients to vendedores via recomendacoes.codigo_vendedor
// ----------------------------------------------------------------
async function syncClientes(
  credentials: OmieCredentials,
  maxPages = 999,
  /** DD/MM/YYYY — only fetch clients modified since this date (incremental) */
  dateFrom?: string,
): Promise<{ criados: number; atualizados: number; processados: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  // Pre-load vendedor mapping (omie_id → UUID)
  const { data: allVendedores } = await supabase
    .from('vendedores')
    .select('id, omie_id')

  const vendedorMap = new Map<number, string>()
  for (const v of allVendedores || []) {
    if (v.omie_id) vendedorMap.set(v.omie_id, v.id)
  }

  let pagina = 1
  let totalPages = 1
  let criados = 0
  let atualizados = 0
  let processados = 0
  const errors: string[] = []

  while (pagina <= Math.min(totalPages, maxPages)) {
    const clienteParams: Record<string, unknown> = {
      pagina,
      registros_por_pagina: PAGE_SIZE,
    }
    // Incremental: only fetch clients modified since dateFrom
    // Omie ListarClientes uses top-level date filter params (NOT inside clientesFiltro)
    if (dateFrom) {
      clienteParams.filtrar_por_data_de = dateFrom
      clienteParams.filtrar_apenas_alteracao = 'S'
    }

    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint: 'geral/clientes',
      call: 'ListarClientes',
      params: clienteParams,
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.clientes_cadastro as OmieCliente[]) || []

    // Build batch records
    const records = items.map((cli) => {
      const clientInfo = resolveClientInfo(cli.tags || [])
      const telefone = cli.telefone1_ddd && cli.telefone1_numero
        ? `(${cli.telefone1_ddd}) ${cli.telefone1_numero}`
        : cli.telefone1_numero || null

      // Map vendedor via recomendacoes.codigo_vendedor
      const codigoVendedor = cli.recomendacoes?.codigo_vendedor
      const vendedor_id = codigoVendedor ? vendedorMap.get(codigoVendedor) ?? null : null

      return {
        omie_id: cli.codigo_cliente_omie,
        nome: cli.razao_social || cli.nome_fantasia,
        tipo: clientInfo.tipo,
        administradora: clientInfo.administradora,
        status: cli.inativo === 'S' ? 'inativo' as const : 'ativo' as const,
        vendedor_id,
        cnpj: cli.cnpj_cpf || null,
        telefone,
        email: cli.email || null,
        updated_at: new Date().toISOString(),
      }
    })

    // Bulk upsert by omie_id
    if (records.length > 0) {
      const { error, count } = await supabase
        .from('clientes')
        .upsert(records, { onConflict: 'omie_id', count: 'exact' })

      if (error) {
        errors.push(`Upsert page ${pagina}: ${error.message}`)
      } else {
        processados += records.length
        criados += count ?? records.length
      }
    }

    pagina++

    // Rate limit: ~300ms between pages
    if (pagina <= totalPages) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  }

  return { criados, atualizados, processados, errors }
}

// ----------------------------------------------------------------
// Sync Vendas — page by page with bulk upsert
// ----------------------------------------------------------------
interface SyncVendasOptions {
  maxPages?: number
  /** Date filter: registration date FROM (DD/MM/YYYY) */
  dateFrom?: string
  /** Date filter: registration date TO (DD/MM/YYYY) */
  dateTo?: string
}

interface SyncVendasResult {
  criados: number
  atualizados: number
  processados: number
  errors: string[]
  skipped: { noClient: number; noVendedor: number; zeroValue: number; total: number }
  totalApiRecords: number
  pagesProcessed: number
  totalPages: number
}

async function syncVendas(
  credentials: OmieCredentials,
  options: SyncVendasOptions = {},
): Promise<SyncVendasResult> {
  const { maxPages = 999, dateFrom, dateTo } = options
  const supabase = getSupabaseAdmin()

  // Pre-load client mapping (omie_id → {id, tipo, vendedor_id})
  // PostgREST max-rows=1000 — must paginate to load all 3000+ clients
  const clienteMap = new Map<number, { id: string; tipo: string; vendedor_id: string | null }>()
  {
    const PAGE = 1000
    let from = 0
    let hasMore = true
    while (hasMore) {
      const { data } = await supabase
        .from('clientes')
        .select('id, omie_id, tipo, vendedor_id')
        .range(from, from + PAGE - 1)
      for (const c of data || []) {
        if (c.omie_id) clienteMap.set(c.omie_id, { id: c.id, tipo: c.tipo, vendedor_id: c.vendedor_id })
      }
      hasMore = (data?.length || 0) === PAGE
      from += PAGE
    }
  }

  // Pre-load vendedor mapping (omie_id → UUID) for conta.codigo_vendedor resolution
  const { data: allVendedores } = await supabase
    .from('vendedores')
    .select('id, omie_id')

  const vendedorMap = new Map<number, string>()
  for (const v of allVendedores || []) {
    if (v.omie_id) vendedorMap.set(v.omie_id, v.id)
  }

  let pagina = 1
  let totalPages = 1
  let criados = 0
  let atualizados = 0
  let processados = 0
  const errors: string[] = []
  let skipNoClient = 0
  let skipNoVendedor = 0
  let skipZeroValue = 0
  let totalApiRecords = 0

  // Build API params with optional date filters
  const baseParams: Record<string, unknown> = {
    registros_por_pagina: PAGE_SIZE,
  }
  if (dateFrom) baseParams.filtrar_por_registro_de = dateFrom
  if (dateTo) baseParams.filtrar_por_registro_ate = dateTo

  while (pagina <= Math.min(totalPages, maxPages)) {
    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint: 'financas/contareceber',
      call: 'ListarContasReceber',
      params: { ...baseParams, pagina },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.conta_receber_cadastro as OmieContaReceber[]) || []
    totalApiRecords += items.length

    // Build batch records
    const records = []
    for (const conta of items) {
      if (!conta.codigo_cliente_fornecedor) {
        skipNoClient++
        continue
      }

      const cliente = clienteMap.get(conta.codigo_cliente_fornecedor)
      if (!cliente) {
        skipNoClient++
        continue
      }

      // Primary: conta.codigo_vendedor (present on ~90% of VENR records)
      // Fallback: cliente.vendedor_id (from recomendacoes.codigo_vendedor)
      const vendedorId = conta.codigo_vendedor
        ? vendedorMap.get(conta.codigo_vendedor) ?? cliente.vendedor_id
        : cliente.vendedor_id

      if (!vendedorId) {
        skipNoVendedor++
        continue
      }

      // Parse date (format: dd/mm/yyyy)
      const dataStr = conta.data_vencimento || conta.data_registro
      let mes = new Date().getMonth() + 1
      let ano = new Date().getFullYear()
      let dataVenda: string | null = null

      if (dataStr) {
        const parts = dataStr.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          mes = parseInt(parts[1])
          ano = parseInt(parts[2])
          dataVenda = `${ano}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
      }

      const valor = conta.valor_documento || (conta.categorias?.[0]?.valor) || 0
      if (valor <= 0) {
        skipZeroValue++
        continue
      }

      let status: 'faturado' | 'pendente' | 'cancelado' = 'pendente'
      const statusOmie = (conta.status_titulo || '').toUpperCase()
      if (statusOmie === 'LIQUIDADO' || statusOmie === 'RECEBIDO') {
        status = 'faturado'
      } else if (statusOmie === 'CANCELADO') {
        status = 'cancelado'
      }

      records.push({
        omie_id: conta.codigo_lancamento_omie,
        cliente_id: cliente.id,
        vendedor_id: vendedorId,
        valor,
        mes,
        ano,
        data_venda: dataVenda,
        tipo_cliente: cliente.tipo,
        status,
        nota_fiscal: conta.numero_documento || null,
        observacao: conta.observacao || null,
      })
    }

    // Bulk upsert by omie_id
    if (records.length > 0) {
      const { error, count } = await supabase
        .from('vendas')
        .upsert(records, { onConflict: 'omie_id', count: 'exact' })

      if (error) {
        errors.push(`Upsert vendas page ${pagina}: ${error.message}`)
      } else {
        processados += records.length
        criados += count ?? records.length
      }
    }

    pagina++

    if (pagina <= totalPages) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  }

  const skipped = {
    noClient: skipNoClient,
    noVendedor: skipNoVendedor,
    zeroValue: skipZeroValue,
    total: skipNoClient + skipNoVendedor + skipZeroValue,
  }

  return { criados, atualizados, processados, errors, skipped, totalApiRecords, pagesProcessed: pagina - 1, totalPages }
}

// ----------------------------------------------------------------
// Sync Pedidos — from /produtos/pedido/ → ListarPedidos
// ----------------------------------------------------------------
const PEDIDOS_MAX_PAGES_PER_CALL = 5  // Limit per invocation to stay under 60s timeout

interface SyncPedidosOptions {
  maxPages?: number
  dateFrom?: string
  /** Start from this page (1-based). Used for pagination across calls. */
  startPage?: number
}

interface SyncPedidosResult {
  criados: number
  atualizados: number
  processados: number
  itensProcessados: number
  errors: string[]
  skipped: { noClient: number; total: number }
  totalApiRecords: number
  pagesProcessed: number
  totalPages: number
  /** If true, there are more pages. Frontend should call again with nextPage. */
  hasMore: boolean
  /** Next page to request (only set when hasMore=true). */
  nextPage?: number
}

async function syncPedidos(
  credentials: OmieCredentials,
  options: SyncPedidosOptions = {},
): Promise<SyncPedidosResult> {
  const { maxPages = 999, dateFrom, startPage = 1 } = options
  const effectiveMaxPages = Math.min(maxPages, PEDIDOS_MAX_PAGES_PER_CALL)
  const supabase = getSupabaseAdmin()

  // Pre-load client mapping (omie_id → UUID)
  const clienteMap = new Map<number, string>()
  {
    const PAGE = 1000
    let from = 0
    let hasMore = true
    while (hasMore) {
      const { data } = await supabase
        .from('clientes')
        .select('id, omie_id')
        .range(from, from + PAGE - 1)
      for (const c of data || []) {
        if (c.omie_id) clienteMap.set(c.omie_id, c.id)
      }
      hasMore = (data?.length || 0) === PAGE
      from += PAGE
    }
  }

  // Pre-load vendedor mapping (omie_id → UUID)
  const { data: allVendedores } = await supabase
    .from('vendedores')
    .select('id, omie_id')

  const vendedorMap = new Map<number, string>()
  for (const v of allVendedores || []) {
    if (v.omie_id) vendedorMap.set(v.omie_id, v.id)
  }

  let pagina = startPage
  let totalPages = startPage  // Will be updated after first API call
  let pagesProcessedThisCall = 0
  let criados = 0
  let atualizados = 0
  let processados = 0
  let itensProcessados = 0
  const errors: string[] = []
  let skipNoClient = 0
  let totalApiRecords = 0

  const baseParams: Record<string, unknown> = {
    registros_por_pagina: PAGE_SIZE,
  }
  if (dateFrom) {
    baseParams.filtrar_por_data_de = dateFrom
    baseParams.filtrar_apenas_alteracao = 'S'
  }

  while (pagina <= totalPages && pagesProcessedThisCall < effectiveMaxPages) {
    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint: 'produtos/pedido',
      call: 'ListarPedidos',
      params: { ...baseParams, pagina },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.pedido_venda_produto as OmiePedidoRaw[]) || []
    totalApiRecords += items.length

    // Build pedido records for this page
    const pedidoRecords = []
    const pedidoItensMap = new Map<number, Array<{
      produto_omie_id: number | null
      descricao: string | null
      quantidade: number
      valor_unitario: number
      valor_total: number
      unidade: string | null
    }>>()

    for (const pedido of items) {
      const cab = pedido.cabecalho
      if (!cab?.codigo_pedido) continue

      const clienteId = clienteMap.get(cab.codigo_cliente)
      if (!clienteId) {
        skipNoClient++
        continue
      }

      const vendedorId = cab.codigo_vendedor
        ? vendedorMap.get(cab.codigo_vendedor) ?? null
        : null

      let previsaoFaturamento: string | null = null
      const prevStr = pedido.frete?.previsao_entrega || cab.data_previsao
      if (prevStr) {
        const parts = prevStr.split('/')
        if (parts.length === 3) {
          previsaoFaturamento = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }

      let dataPedido: string | null = null
      const dInc = pedido.infoCadastro?.dInc
      if (dInc) {
        const parts = dInc.split('/')
        if (parts.length === 3) {
          dataPedido = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }

      const etapa = cab.etapa || pedido.infoCadastro?.cEtapa || null

      pedidoRecords.push({
        omie_id: cab.codigo_pedido,
        cliente_id: clienteId,
        vendedor_id: vendedorId,
        numero_pedido: cab.numero_pedido || String(cab.codigo_pedido),
        valor_total: pedido.total_pedido?.valor_total_pedido ?? 0,
        etapa,
        status: etapa?.toUpperCase() === 'CANCELADO' ? 'cancelado' : 'aberto',
        previsao_faturamento: previsaoFaturamento,
        data_pedido: dataPedido,
        observacao: pedido.observacoes?.obs_venda || null,
        updated_at: new Date().toISOString(),
      })

      if (pedido.det && pedido.det.length > 0) {
        const itens = pedido.det.map((det) => ({
          produto_omie_id: det.produto?.codigo_produto ?? null,
          descricao: det.produto?.descricao ?? null,
          quantidade: det.produto?.quantidade ?? 0,
          valor_unitario: det.produto?.valor_unitario ?? 0,
          valor_total: det.produto?.valor_total ?? 0,
          unidade: det.produto?.unidade ?? null,
        }))
        pedidoItensMap.set(cab.codigo_pedido, itens)
      }
    }

    // Bulk upsert pedidos by omie_id
    if (pedidoRecords.length > 0) {
      const { error, count } = await supabase
        .from('pedidos')
        .upsert(pedidoRecords, { onConflict: 'omie_id', count: 'exact' })

      if (error) {
        errors.push(`Upsert pedidos page ${pagina}: ${error.message}`)
      } else {
        processados += pedidoRecords.length
        criados += count ?? pedidoRecords.length

        // Fetch pedido UUIDs for this batch
        const omieIds = pedidoRecords.map((r) => r.omie_id)
        const { data: pedidoRows } = await supabase
          .from('pedidos')
          .select('id, omie_id')
          .in('omie_id', omieIds)

        if (pedidoRows && pedidoRows.length > 0) {
          // Build omie→uuid map for this batch
          const omieToUuid = new Map<number, string>()
          for (const row of pedidoRows) {
            omieToUuid.set(row.omie_id, row.id)
          }

          // Collect pedido_ids that have items for batch delete
          const pedidoIdsWithItems: string[] = []
          const allItensToInsert: Array<{
            pedido_id: string
            produto_omie_id: number | null
            descricao: string | null
            quantidade: number
            valor_unitario: number
            valor_total: number
            unidade: string | null
          }> = []

          for (const [omieId, itens] of pedidoItensMap) {
            const pedidoUuid = omieToUuid.get(omieId)
            if (!pedidoUuid || itens.length === 0) continue

            pedidoIdsWithItems.push(pedidoUuid)
            for (const item of itens) {
              allItensToInsert.push({ ...item, pedido_id: pedidoUuid })
            }
          }

          // Batch delete all existing items for these pedidos (1 call)
          if (pedidoIdsWithItems.length > 0) {
            await supabase
              .from('pedido_itens')
              .delete()
              .in('pedido_id', pedidoIdsWithItems)
          }

          // Batch insert all items at once (1 call, max ~1000 rows per batch)
          if (allItensToInsert.length > 0) {
            const BATCH_SIZE = 500
            for (let i = 0; i < allItensToInsert.length; i += BATCH_SIZE) {
              const batch = allItensToInsert.slice(i, i + BATCH_SIZE)
              const { error: itensError } = await supabase
                .from('pedido_itens')
                .insert(batch)

              if (itensError) {
                errors.push(`Insert itens batch ${Math.floor(i / BATCH_SIZE)}: ${itensError.message}`)
              } else {
                itensProcessados += batch.length
              }
            }
          }
        }
      }
    }

    pagina++
    pagesProcessedThisCall++

    if (pagina <= totalPages && pagesProcessedThisCall < effectiveMaxPages) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  }

  const hasMorePages = pagina <= totalPages

  return {
    criados,
    atualizados,
    processados,
    itensProcessados,
    errors,
    skipped: { noClient: skipNoClient, total: skipNoClient },
    totalApiRecords,
    pagesProcessed: pagesProcessedThisCall,
    totalPages,
    hasMore: hasMorePages,
    nextPage: hasMorePages ? pagina : undefined,
  }
}

// ----------------------------------------------------------------
// Main handler
// ----------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Require admin or gerente role
    const user = await requireAuth(req)
    requireRole(user, ['admin', 'gerente'])

    const body = await req.json().catch(() => ({})) as {
      type?: string
      mode?: 'incremental' | 'full'
      maxPages?: number
      /** Date filter FROM for vendas (DD/MM/YYYY) */
      dateFrom?: string
      /** Date filter TO for vendas (DD/MM/YYYY) */
      dateTo?: string
      /** Start page for pedidos pagination (1-based) */
      startPage?: number
    }
    const syncType = body.type || 'full'
    const syncMode = body.mode || 'incremental'
    const maxPages = body.maxPages || 999

    const credentials = await getOmieCredentials()
    const supabaseAdmin = getSupabaseAdmin()

    // For incremental mode: calculate date filter from ultimo_sync
    let incrementalDateFrom: string | undefined
    if (syncMode === 'incremental') {
      const { data: configData } = await supabaseAdmin
        .from('config_omie')
        .select('ultimo_sync')
        .limit(1)
        .single()

      if (configData?.ultimo_sync) {
        // Subtract 1 day safety margin for timezone edge cases
        const sinceDate = new Date(configData.ultimo_sync)
        sinceDate.setDate(sinceDate.getDate() - 1)
        incrementalDateFrom = `${String(sinceDate.getDate()).padStart(2, '0')}/${String(sinceDate.getMonth() + 1).padStart(2, '0')}/${sinceDate.getFullYear()}`
      }
      // If no ultimo_sync (first run), incrementalDateFrom stays undefined → full fetch
    }

    // Explicit dateFrom from body overrides incremental calculation
    const effectiveDateFrom = body.dateFrom || incrementalDateFrom

    // Acquire server-side sync lock
    const { data: lockAcquired } = await supabaseAdmin.rpc('acquire_sync_lock')
    if (!lockAcquired) {
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'Sync already in progress' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const results: Record<string, unknown> = {}

    // 1) Sync vendedores (must run before clientes to build omie_id → UUID map)
    if (syncType === 'full' || syncType === 'vendedores') {
      const t0 = Date.now()
      const vendResult = await syncVendedores(credentials, maxPages)
      results.vendedores = vendResult

      await logSync({
        tipo: syncMode === 'full' ? 'full_sync' : 'incremental',
        endpoint: '/geral/vendedores/',
        call_method: 'ListarVendedores',
        status: vendResult.errors.length > 0 ? 'partial' : 'success',
        registros_processados: vendResult.processados,
        registros_criados: vendResult.criados,
        registros_atualizados: vendResult.atualizados,
        erros: vendResult.errors.length > 0 ? { errors: vendResult.errors } : null,
        duracao_ms: Date.now() - t0,
      })
    }

    // 2) Sync clientes (uses vendedor map from step 1)
    if (syncType === 'full' || syncType === 'clientes') {
      const t0 = Date.now()
      const clientResult = await syncClientes(credentials, maxPages, effectiveDateFrom)
      results.clientes = clientResult

      await logSync({
        tipo: syncMode === 'full' ? 'full_sync' : 'incremental',
        endpoint: '/geral/clientes/',
        call_method: 'ListarClientes',
        status: clientResult.errors.length > 0 ? 'partial' : 'success',
        registros_processados: clientResult.processados,
        registros_criados: clientResult.criados,
        registros_atualizados: clientResult.atualizados,
        erros: clientResult.errors.length > 0 ? { errors: clientResult.errors } : null,
        duracao_ms: Date.now() - t0,
      })
    }

    // 3) Sync vendas (contas a receber — uses cliente+vendedor maps)
    if (syncType === 'full' || syncType === 'vendas') {
      const t0 = Date.now()
      const vendasResult = await syncVendas(credentials, {
        maxPages,
        dateFrom: effectiveDateFrom,
        dateTo: body.dateTo,
      })
      results.vendas = vendasResult

      const hasIssues = vendasResult.errors.length > 0 || vendasResult.skipped.total > 0
      await logSync({
        tipo: syncMode === 'full' ? 'full_sync' : 'incremental',
        endpoint: '/financas/contareceber/',
        call_method: 'ListarContasReceber',
        status: vendasResult.errors.length > 0 ? 'partial' : 'success',
        registros_processados: vendasResult.processados,
        registros_criados: vendasResult.criados,
        registros_atualizados: vendasResult.atualizados,
        erros: hasIssues ? {
          errors: vendasResult.errors,
          skipped: vendasResult.skipped,
          totalApiRecords: vendasResult.totalApiRecords,
          pagesProcessed: vendasResult.pagesProcessed,
          totalPages: vendasResult.totalPages,
        } : null,
        duracao_ms: Date.now() - t0,
      })
    }

    // 4) Sync pedidos (uses cliente+vendedor maps)
    if (syncType === 'full' || syncType === 'pedidos') {
      const t0 = Date.now()
      const pedidosResult = await syncPedidos(credentials, {
        maxPages,
        dateFrom: effectiveDateFrom,
        startPage: body.startPage,
      })
      results.pedidos = pedidosResult

      const hasIssues = pedidosResult.errors.length > 0 || pedidosResult.skipped.total > 0
      await logSync({
        tipo: syncMode === 'full' ? 'full_sync' : 'incremental',
        endpoint: '/produtos/pedido/',
        call_method: 'ListarPedidos',
        status: pedidosResult.errors.length > 0 ? 'partial' : 'success',
        registros_processados: pedidosResult.processados,
        registros_criados: pedidosResult.criados,
        registros_atualizados: pedidosResult.atualizados,
        erros: hasIssues ? {
          errors: pedidosResult.errors,
          skipped: pedidosResult.skipped,
          itensProcessados: pedidosResult.itensProcessados,
          totalApiRecords: pedidosResult.totalApiRecords,
          pagesProcessed: pedidosResult.pagesProcessed,
          totalPages: pedidosResult.totalPages,
        } : null,
        duracao_ms: Date.now() - t0,
      })
    }

    // Release lock and mark idle
    await supabaseAdmin.rpc('release_sync_lock', { p_status: 'success' })

    return new Response(
      JSON.stringify({
        status: 'success',
        type: syncType,
        mode: syncMode,
        dateFrom: effectiveDateFrom || null,
        duration_ms: Date.now() - startTime,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(
        JSON.stringify({ status: 'error', error: err.message }),
        { status: err.statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const message = err instanceof Error ? err.message : String(err)

    try {
      const sa = getSupabaseAdmin()
      await sa.rpc('release_sync_lock', { p_status: 'error' })
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ status: 'error', error: message, duration_ms: Date.now() - startTime }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
