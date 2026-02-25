import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types/database'

type SyncLog = Tables<'sync_logs'>
type ConfigOmie = Tables<'config_omie'>

export async function getSyncLogs(limit = 50): Promise<SyncLog[]> {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SyncLog[]
}

export async function getConfigOmie(): Promise<ConfigOmie | null> {
  const { data, error } = await supabase
    .from('config_omie')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ConfigOmie | null
}

export type SyncType = 'full' | 'vendedores' | 'clientes' | 'vendas'

export interface SyncResult {
  status: 'success' | 'error'
  type: SyncType
  duration_ms: number
  results: {
    vendedores?: { criados: number; atualizados: number; processados: number }
    clientes?: { criados: number; atualizados: number; processados: number }
    vendas?: { criados: number; atualizados: number; processados: number }
  }
  error?: string
}

export async function triggerSync(
  type: SyncType = 'full',
  maxPages?: number,
): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('omie-sync', {
    body: { type, ...(maxPages ? { maxPages } : {}) },
  })
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
