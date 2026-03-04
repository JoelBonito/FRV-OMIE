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
