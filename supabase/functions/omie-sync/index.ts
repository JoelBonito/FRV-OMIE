/**
 * Edge Function: omie-sync
 *
 * Syncs vendedores, clients and sales from Omie to Supabase.
 * Processes page-by-page with bulk upsert to stay within timeout.
 * Order: vendedores → clientes → vendas (dependency chain).
 *
 * POST /functions/v1/omie-sync
 * Body: { type: "full" | "vendedores" | "clientes" | "vendas", maxPages?: number }
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { omieCall, resolveClientType, type OmieCredentials } from '../_shared/omie-client.ts'
import {
  getSupabaseAdmin,
  getOmieCredentials,
  logSync,
  updateSyncStatus,
} from '../_shared/supabase-admin.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, requireRole, AuthError } from '../_shared/auth.ts'

const PAGE_SIZE = 200  // Max per page to reduce API calls

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
      await new Promise((r) => setTimeout(r, 300))
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
    const result = await omieCall<Record<string, unknown>>(credentials, {
      endpoint: 'geral/clientes',
      call: 'ListarClientes',
      params: { pagina, registros_por_pagina: PAGE_SIZE },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.clientes_cadastro as OmieCliente[]) || []

    // Build batch records
    const records = items.map((cli) => {
      const tipo = resolveClientType(cli.tags || [])
      const telefone = cli.telefone1_ddd && cli.telefone1_numero
        ? `(${cli.telefone1_ddd}) ${cli.telefone1_numero}`
        : cli.telefone1_numero || null

      // Map vendedor via recomendacoes.codigo_vendedor
      const codigoVendedor = cli.recomendacoes?.codigo_vendedor
      const vendedor_id = codigoVendedor ? vendedorMap.get(codigoVendedor) ?? null : null

      return {
        omie_id: cli.codigo_cliente_omie,
        nome: cli.razao_social || cli.nome_fantasia,
        tipo,
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
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  return { criados, atualizados, processados, errors }
}

// ----------------------------------------------------------------
// Sync Vendas — page by page with bulk upsert
// ----------------------------------------------------------------
async function syncVendas(
  credentials: OmieCredentials,
  maxPages = 999,
): Promise<{ criados: number; atualizados: number; processados: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  // Pre-load client mapping (omie_id → {id, tipo, vendedor_id})
  const { data: allClientes } = await supabase
    .from('clientes')
    .select('id, omie_id, tipo, vendedor_id')

  const clienteMap = new Map<number, { id: string; tipo: string; vendedor_id: string | null }>()
  for (const c of allClientes || []) {
    if (c.omie_id) {
      clienteMap.set(c.omie_id, { id: c.id, tipo: c.tipo, vendedor_id: c.vendedor_id })
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
      endpoint: 'financas/contareceber',
      call: 'ListarContasReceber',
      params: { pagina, registros_por_pagina: PAGE_SIZE },
    })

    if (result.status === 'error') {
      errors.push(`Page ${pagina}: ${result.error}`)
      break
    }

    totalPages = (result.data.total_de_paginas as number) || 1
    const items = (result.data.conta_receber_cadastro as OmieContaReceber[]) || []

    // Build batch records
    const records = []
    for (const conta of items) {
      if (!conta.codigo_cliente_fornecedor) continue

      const cliente = clienteMap.get(conta.codigo_cliente_fornecedor)
      if (!cliente || !cliente.vendedor_id) continue

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
      if (valor <= 0) continue

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
        vendedor_id: cliente.vendedor_id,
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
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  return { criados, atualizados, processados, errors }
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
      maxPages?: number
    }
    const syncType = body.type || 'full'
    // Default maxPages: enough for ~3000 clients in 200/page = 16 pages
    // Edge Function timeout is ~60s, each page ~1s = safe up to ~50 pages
    const maxPages = body.maxPages || 50

    const credentials = await getOmieCredentials()
    const supabaseAdmin = getSupabaseAdmin()

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
        tipo: syncType === 'full' ? 'full_sync' : 'incremental',
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
      const clientResult = await syncClientes(credentials, maxPages)
      results.clientes = clientResult

      await logSync({
        tipo: syncType === 'full' ? 'full_sync' : 'incremental',
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
      const vendasResult = await syncVendas(credentials, maxPages)
      results.vendas = vendasResult

      await logSync({
        tipo: syncType === 'full' ? 'full_sync' : 'incremental',
        endpoint: '/financas/contareceber/',
        call_method: 'ListarContasReceber',
        status: vendasResult.errors.length > 0 ? 'partial' : 'success',
        registros_processados: vendasResult.processados,
        registros_criados: vendasResult.criados,
        registros_atualizados: vendasResult.atualizados,
        erros: vendasResult.errors.length > 0 ? { errors: vendasResult.errors } : null,
        duracao_ms: Date.now() - t0,
      })
    }

    // Release lock and mark idle
    await supabaseAdmin.rpc('release_sync_lock', { p_status: 'idle' })

    return new Response(
      JSON.stringify({
        status: 'success',
        type: syncType,
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
