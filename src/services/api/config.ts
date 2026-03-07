import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/types/database'

export type ConfigOmieSafe = Views<'config_omie_safe'>

export async function getConfigOmie(): Promise<ConfigOmieSafe | null> {
  const { data, error } = await supabase
    .from('config_omie_safe' as any)
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ConfigOmieSafe | null
}

export async function updateOmieCredentials(
  appKey: string,
  appSecret: string,
  webhookSecret?: string,
): Promise<void> {
  const { error } = await (supabase.rpc as any)('update_omie_credentials', {
    p_app_key: appKey,
    p_app_secret: appSecret,
    p_webhook_secret: webhookSecret || null,
  })
  if (error) throw error
}

export async function generateWebhookSecret(): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('generate_webhook_secret')
  if (error) throw error
  return data as string
}
