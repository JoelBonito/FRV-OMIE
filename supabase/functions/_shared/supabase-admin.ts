/**
 * Supabase admin client for Edge Functions (service_role key).
 * Bypasses RLS for server-side operations.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

let _clientFrv: SupabaseClient | null = null
let _clientPublic: SupabaseClient | null = null

/**
 * Get admin client for frv_omie schema.
 * Falls back to public schema if frv_omie is not exposed in PostgREST.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_clientFrv) return _clientFrv

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  _clientFrv = createClient(url, key, {
    db: { schema: 'frv_omie' },
    auth: { persistSession: false },
    global: {
      headers: {
        'Accept-Profile': 'frv_omie',
        'Content-Profile': 'frv_omie',
      },
    },
  })

  return _clientFrv
}

/**
 * Get admin client for public schema (fallback).
 */
export function getSupabasePublic(): SupabaseClient {
  if (_clientPublic) return _clientPublic

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  _clientPublic = createClient(url, key, {
    auth: { persistSession: false },
  })

  return _clientPublic
}

/**
 * Fetch Omie credentials from config_omie table.
 */
export async function getOmieCredentials(): Promise<{ app_key: string; app_secret: string; id: string }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('config_omie')
    .select('id, app_key, app_secret')
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(`No Omie credentials configured: ${error?.message}`)
  }

  return { app_key: data.app_key, app_secret: data.app_secret, id: data.id }
}

/**
 * Log sync operation to sync_logs table.
 */
export async function logSync(entry: {
  tipo: string
  endpoint: string
  call_method: string
  status: 'success' | 'error' | 'partial'
  registros_processados?: number
  registros_criados?: number
  registros_atualizados?: number
  erros?: unknown
  duracao_ms?: number
  payload_resumo?: unknown
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  await supabase.from('sync_logs').insert({
    tipo: entry.tipo,
    endpoint: entry.endpoint,
    call_method: entry.call_method,
    status: entry.status,
    registros_processados: entry.registros_processados ?? 0,
    registros_criados: entry.registros_criados ?? 0,
    registros_atualizados: entry.registros_atualizados ?? 0,
    erros: entry.erros ? JSON.parse(JSON.stringify(entry.erros)) : null,
    duracao_ms: entry.duracao_ms ?? 0,
    payload_resumo: entry.payload_resumo ? JSON.parse(JSON.stringify(entry.payload_resumo)) : null,
  })
}

/**
 * Update sync status in config_omie.
 */
export async function updateSyncStatus(configId: string, status: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('config_omie')
    .update({
      status_sync: status,
      ultimo_sync: status === 'idle' ? new Date().toISOString() : undefined,
    })
    .eq('id', configId)
}
