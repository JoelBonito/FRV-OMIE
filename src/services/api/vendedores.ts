import { supabase } from '@/lib/supabase'
import type { Tables, InsertTables, UpdateTables } from '@/lib/types/database'

type Vendedor = Tables<'vendedores'>

export async function getVendedores(): Promise<Vendedor[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .order('nome')
  if (error) throw error
  return (data ?? []) as Vendedor[]
}

export async function getVendedor(id: string): Promise<Vendedor> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Vendedor
}

export async function createVendedor(
  vendedor: InsertTables<'vendedores'>
): Promise<Vendedor> {
  const { data, error } = await supabase
    .from('vendedores')
    .insert(vendedor)
    .select()
    .single()
  if (error) throw error
  return data as Vendedor
}

export async function updateVendedor(
  id: string,
  vendedor: UpdateTables<'vendedores'>
): Promise<Vendedor> {
  const { data, error } = await supabase
    .from('vendedores')
    .update(vendedor)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Vendedor
}
