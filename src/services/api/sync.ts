import { supabase } from '@/lib/supabase'
import type { Tables, Views } from '@/lib/types/database'

type SyncLog = Tables<'sync_logs'>
export type ConfigOmieSafe = Views<'config_omie_safe'>

export async function getSyncLogs(limit = 50): Promise<SyncLog[]> {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SyncLog[]
}

export async function getConfigOmie(): Promise<ConfigOmieSafe | null> {
  const { data, error } = await supabase
    .from('config_omie_safe' as any)
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ConfigOmieSafe | null
}

export type SyncType = 'full' | 'vendedores' | 'clientes' | 'vendas' | 'pedidos'
export type SyncMode = 'incremental' | 'full'

export interface PedidosSyncDetail {
  criados: number
  atualizados: number
  processados: number
  itensProcessados?: number
  hasMore?: boolean
  nextPage?: number
  totalPages?: number
  pagesProcessed?: number
}

export interface SyncResult {
  status: 'success' | 'error'
  type: SyncType
  mode: SyncMode
  dateFrom: string | null
  duration_ms: number
  results: {
    vendedores?: { criados: number; atualizados: number; processados: number }
    clientes?: { criados: number; atualizados: number; processados: number }
    vendas?: { criados: number; atualizados: number; processados: number }
    pedidos?: PedidosSyncDetail
  }
  error?: string
}

export async function triggerSync(
  type: SyncType = 'full',
  mode: SyncMode = 'incremental',
  options?: { startPage?: number },
): Promise<SyncResult> {
  const body: Record<string, unknown> = { type, mode }
  if (options?.startPage) body.startPage = options.startPage

  const { data, error } = await supabase.functions.invoke('omie-sync', { body })
  if (error) throw error
  return data as SyncResult
}

export async function omieProxy(
  endpoint: string,
  call: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('omie-proxy', {
    body: { endpoint, call, params },
  })
  if (error) throw error
  return data
}
