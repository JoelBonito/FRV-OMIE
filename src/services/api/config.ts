import { supabase } from '@/lib/supabase'
import type { Tables, InsertTables, UpdateTables } from '@/lib/types/database'

type ConfigOmie = Tables<'config_omie'>

export async function getConfigOmie(): Promise<ConfigOmie | null> {
  const { data, error } = await supabase
    .from('config_omie')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ConfigOmie | null
}

export async function upsertConfigOmie(
  config: InsertTables<'config_omie'>,
  existingId?: string
): Promise<ConfigOmie> {
  if (existingId) {
    const updateData: UpdateTables<'config_omie'> = {
      app_key: config.app_key,
      app_secret: config.app_secret,
      webhook_secret: config.webhook_secret,
      sync_interval_hours: config.sync_interval_hours,
    }
    const { data, error } = await supabase
      .from('config_omie')
      .update(updateData)
      .eq('id', existingId)
      .select()
      .single()
    if (error) throw error
    return data as ConfigOmie
  }
  const { data, error } = await supabase
    .from('config_omie')
    .insert(config)
    .select()
    .single()
  if (error) throw error
  return data as ConfigOmie
}
