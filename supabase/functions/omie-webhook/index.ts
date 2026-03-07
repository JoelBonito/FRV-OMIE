/**
 * Edge Function: omie-webhook
 *
 * Receives real-time events from Omie webhooks.
 * Processes client and financial events incrementally.
 *
 * POST /functions/v1/omie-webhook
 *
 * Omie webhook payload format (observed):
 * {
 *   "messageId": "uuid",
 *   "topic": "Financas.ContaReceber.Incluido",
 *   "event": { ...record data... },
 *   "author": { "userId": 123, "appKey": "..." },
 *   "appKey": "...",
 *   "appHash": "..."
 * }
 *
 * Supported topics (actual Omie topic names):
 * - ClienteFornecedor.* (Incluido, Alterado, Excluido)
 * - Financas.ContaReceber.* (Incluido, Alterado, Excluido)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { omieCall, resolveClientType, type OmieCredentials } from '../_shared/omie-client.ts'
import {
  getSupabaseAdmin,
  getOmieCredentials,
  logSync,
} from '../_shared/supabase-admin.ts'
import { getWebhookCorsHeaders } from '../_shared/cors.ts'

// ----------------------------------------------------------------
// Webhook payload types
// ----------------------------------------------------------------
interface OmieWebhookPayload {
  messageId?: string
  topic: string
  event: Record<string, unknown>
  author?: { userId?: number; appKey?: string }
  appKey?: string
  appHash?: string
  // Alternate flat format (some Omie webhooks send this)
  codigo_cliente_omie?: number
  codigo_lancamento_omie?: number
}

// ----------------------------------------------------------------
// Verify webhook authenticity via Omie appKey in the payload body.
// Omie sends { appKey: "...", appHash: "..." } — we compare appKey
// against the app_key stored in config_omie.
// ----------------------------------------------------------------
async function verifyWebhookAppKey(payloadAppKey: string | undefined): Promise<boolean> {
  if (!payloadAppKey) return false

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('config_omie')
    .select('app_key')
    .limit(1)
    .single()

  const storedAppKey = data?.app_key
  if (!storedAppKey) return false

  return payloadAppKey === storedAppKey
}

// ----------------------------------------------------------------
// Process client event: fetch fresh data from Omie and upsert
// ----------------------------------------------------------------
async function processClienteEvent(
  credentials: OmieCredentials,
  payload: OmieWebhookPayload,
  action: string,
): Promise<{ success: boolean; detail: string }> {
  const supabase = getSupabaseAdmin()

  // Extract client ID from event or payload
  const codigoCliente =
    payload.event?.codigo_cliente_omie as number ||
    payload.codigo_cliente_omie ||
    payload.event?.codigo as number

  if (!codigoCliente) {
    return { success: false, detail: 'Missing codigo_cliente_omie in payload' }
  }

  // Excluido = soft delete (mark inactive)
  if (action === 'Excluido') {
    const { error } = await supabase
      .from('clientes')
      .update({ status: 'inativo', data_inativacao: new Date().toISOString().split('T')[0] })
      .eq('omie_id', codigoCliente)

    return error
      ? { success: false, detail: error.message }
      : { success: true, detail: `Client ${codigoCliente} marked inactive` }
  }

  // Incluido/Alterado = fetch fresh data and upsert
  const result = await omieCall<Record<string, unknown>>(credentials, {
    endpoint: 'geral/clientes',
    call: 'ConsultarCliente',
    params: { codigo_cliente_omie: codigoCliente },
  })

  if (result.status === 'error') {
    return { success: false, detail: `Omie API error: ${result.error}` }
  }

  const cli = result.data as Record<string, unknown>
  const tags = (cli.tags as Array<{ tag: string }>) || []
  const tipo = resolveClientType(tags)
  const tel1Ddd = cli.telefone1_ddd as string || ''
  const tel1Num = cli.telefone1_numero as string || ''
  const telefone = tel1Ddd && tel1Num ? `(${tel1Ddd}) ${tel1Num}` : tel1Num || null

  // Resolve vendedor_id from recomendacoes.codigo_vendedor
  const recomendacoes = cli.recomendacoes as Record<string, unknown> | undefined
  const codigoVendedor = recomendacoes?.codigo_vendedor as number | undefined
  let vendedor_id: string | null = null

  if (codigoVendedor) {
    const { data: vendedor } = await supabase
      .from('vendedores')
      .select('id')
      .eq('omie_id', codigoVendedor)
      .single()
    vendedor_id = vendedor?.id ?? null
  }

  const { error } = await supabase
    .from('clientes')
    .upsert(
      {
        omie_id: codigoCliente,
        nome: (cli.razao_social as string) || (cli.nome_fantasia as string),
        tipo,
        status: (cli.inativo as string) === 'S' ? 'inativo' : 'ativo',
        vendedor_id,
        cnpj: (cli.cnpj_cpf as string) || null,
        telefone,
        email: (cli.email as string) || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'omie_id' },
    )

  return error
    ? { success: false, detail: error.message }
    : { success: true, detail: `Client ${codigoCliente} upserted` }
}

// ----------------------------------------------------------------
// Process conta receber event
// ----------------------------------------------------------------
async function processContaReceberEvent(
  _credentials: OmieCredentials,
  payload: OmieWebhookPayload,
  action: string,
): Promise<{ success: boolean; detail: string }> {
  const supabase = getSupabaseAdmin()

  const codigoLancamento =
    payload.event?.codigo_lancamento_omie as number ||
    payload.codigo_lancamento_omie

  if (!codigoLancamento) {
    return { success: false, detail: 'Missing codigo_lancamento_omie in payload' }
  }

  // Excluido = mark cancelled
  if (action === 'Excluido') {
    const { error } = await supabase
      .from('vendas')
      .update({ status: 'cancelado' })
      .eq('omie_id', codigoLancamento)

    return error
      ? { success: false, detail: error.message }
      : { success: true, detail: `Sale ${codigoLancamento} cancelled` }
  }

  // For Incluida/Alterada: extract data from event payload
  const evt = payload.event
  const codigoCliente = evt.codigo_cliente_fornecedor as number

  if (!codigoCliente) {
    return { success: false, detail: 'Missing codigo_cliente_fornecedor' }
  }

  // Look up client in our DB
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, tipo, vendedor_id')
    .eq('omie_id', codigoCliente)
    .single()

  if (!cliente) {
    return { success: false, detail: `Client omie_id=${codigoCliente} not found in DB — run sync first` }
  }

  // Primary: conta.codigo_vendedor from event payload
  // Fallback: cliente.vendedor_id (from recomendacoes.codigo_vendedor)
  let vendedorId: string | null = cliente.vendedor_id
  const contaCodigoVendedor = evt.codigo_vendedor as number | undefined
  if (contaCodigoVendedor) {
    const { data: vendedor } = await supabase
      .from('vendedores')
      .select('id')
      .eq('omie_id', contaCodigoVendedor)
      .single()
    if (vendedor) vendedorId = vendedor.id
  }

  if (!vendedorId) {
    // Skip silently — same as omie-sync (vendedor_id is NOT NULL in DB)
    return { success: true, detail: `Skipped conta ${codigoLancamento}: no vendedor (conta.codigo_vendedor=${contaCodigoVendedor || 0}, client vendedor_id=null)` }
  }

  // Parse date — webhook sends ISO 8601, sync API sends DD/MM/YYYY
  const dataStr = (evt.data_vencimento as string) || (evt.data_registro as string) || ''
  let mes = new Date().getMonth() + 1
  let ano = new Date().getFullYear()
  let dataVenda: string | null = null

  if (dataStr) {
    // Try DD/MM/YYYY first (sync API format)
    const slashParts = dataStr.split('/')
    if (slashParts.length === 3) {
      const day = parseInt(slashParts[0])
      mes = parseInt(slashParts[1])
      ano = parseInt(slashParts[2])
      dataVenda = `${ano}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    } else {
      // Fallback: ISO 8601 (webhook format: "2026-03-02T00:00:00-03:00")
      const isoMatch = dataStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (isoMatch) {
        ano = parseInt(isoMatch[1])
        mes = parseInt(isoMatch[2])
        const day = parseInt(isoMatch[3])
        dataVenda = `${ano}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }
  }

  const valor = (evt.valor_documento as number) || 0
  if (valor <= 0) {
    return { success: false, detail: `Invalid valor: ${valor}` }
  }

  let status: 'faturado' | 'pendente' | 'cancelado' = 'pendente'
  // Webhook sends "situacao", sync API sends "status_titulo" — check both
  const statusOmie = ((evt.status_titulo as string) || (evt.situacao as string) || '').toUpperCase()
  if (statusOmie === 'LIQUIDADO' || statusOmie === 'RECEBIDO') {
    status = 'faturado'
  } else if (statusOmie === 'CANCELADO') {
    status = 'cancelado'
  }

  const { error } = await supabase
    .from('vendas')
    .upsert(
      {
        omie_id: codigoLancamento,
        cliente_id: cliente.id,
        vendedor_id: vendedorId,
        valor,
        mes,
        ano,
        data_venda: dataVenda,
        tipo_cliente: cliente.tipo,
        status,
        nota_fiscal: (evt.numero_documento as string) || null,
        observacao: (evt.observacao as string) || null,
      },
      { onConflict: 'omie_id' },
    )

  return error
    ? { success: false, detail: error.message }
    : { success: true, detail: `Sale ${codigoLancamento} upserted` }
}

// ----------------------------------------------------------------
// Route webhook by topic
// ----------------------------------------------------------------
function parseTopic(topic: string): { entity: string; action: string } | null {
  // Omie topics can be: 
  // - "Cadastro.Cliente.Incluido"
  // - "Financas.ContaReceber.Incluida"
  // - "ClienteFornecedor.Alterado"
  const parts = topic.split('.')
  if (parts.length < 2) return null

  const actionRaw = parts[parts.length - 1]
  const entity = parts.slice(0, -1).join('.')

  // Normalize action (remove feminine suffix used in some endpoints)
  let action = actionRaw
  if (actionRaw.toLowerCase().startsWith('inclu')) action = 'Incluido'
  if (actionRaw.toLowerCase().startsWith('altera')) action = 'Alterado'
  if (actionRaw.toLowerCase().startsWith('exclu')) action = 'Excluido'

  return { entity, action }
}

// ----------------------------------------------------------------
// Main handler
// ----------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = getWebhookCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const payload = await req.json() as OmieWebhookPayload

    // Verify webhook authenticity via appKey in the payload body
    const isValid = await verifyWebhookAppKey(payload.appKey)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid appKey' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const topic = payload.topic

    if (!topic) {
      // Might be a ping/health check
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Webhook endpoint active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const parsed = parseTopic(topic)
    if (!parsed) {
      await logSync({
        tipo: 'webhook',
        endpoint: topic,
        call_method: 'unknown',
        status: 'error',
        erros: { message: `Unrecognized topic format: ${topic}` },
        duracao_ms: Date.now() - startTime,
      })

      return new Response(
        JSON.stringify({ status: 'ignored', topic }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const credentials = await getOmieCredentials()
    let result: { success: boolean; detail: string }

    switch (parsed.entity) {
      case 'Cadastro.Cliente':
      case 'ClienteFornecedor':
        result = await processClienteEvent(credentials, payload, parsed.action)
        break

      case 'Financas.ContaReceber':
        result = await processContaReceberEvent(credentials, payload, parsed.action)
        break

      default:
        result = { success: true, detail: `Topic ${topic} acknowledged but not processed` }
    }

    await logSync({
      tipo: 'webhook',
      endpoint: topic,
      call_method: parsed.action,
      status: result.success ? 'success' : 'error',
      registros_processados: result.success ? 1 : 0,
      erros: result.success ? null : { message: result.detail },
      duracao_ms: Date.now() - startTime,
      payload_resumo: {
        messageId: payload.messageId,
        entity: parsed.entity,
        action: parsed.action,
      },
    })

    return new Response(
      JSON.stringify({
        status: result.success ? 'ok' : 'error',
        topic,
        detail: result.detail,
        duration_ms: Date.now() - startTime,
      }),
      {
        status: result.success ? 200 : 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    try {
      await logSync({
        tipo: 'webhook',
        endpoint: 'error',
        call_method: 'unknown',
        status: 'error',
        erros: { message },
        duracao_ms: Date.now() - startTime,
      })
    } catch { /* ignore logging errors */ }

    return new Response(
      JSON.stringify({ status: 'error', error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
