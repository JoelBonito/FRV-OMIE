import { supabase } from '@/lib/supabase'
import type { Tables, InsertTables, UpdateTables } from '@/lib/types/database'

type Cliente = Tables<'clientes'>

export interface ClienteWithVendedor extends Cliente {
  vendedores: { nome: string } | null
}

export async function getClientes(): Promise<ClienteWithVendedor[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, vendedores(nome)')
    .order('nome')
  if (error) throw error
  return (data ?? []) as ClienteWithVendedor[]
}

export async function getCliente(id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, vendedores(id, nome)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Cliente & { vendedores: { id: string; nome: string } | null }
}

export async function createCliente(
  cliente: InsertTables<'clientes'>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(cliente)
    .select()
    .single()
  if (error) throw error
  return data as Cliente
}

export async function updateCliente(
  id: string,
  cliente: UpdateTables<'clientes'>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Cliente
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
