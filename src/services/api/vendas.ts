import { supabase } from '@/lib/supabase'
import { fetchAll } from '@/lib/supabase-helpers'
import type { Tables, InsertTables, UpdateTables } from '@/lib/types/database'

type Venda = Tables<'vendas'>

export interface VendaWithRelations extends Venda {
  clientes: { nome: string; tipo: string } | null
  vendedores: { nome: string } | null
}

export async function getVendas(filters?: {
  ano?: number
  mes?: number
  vendedor_id?: string
  tipo_cliente?: string
  status?: string
}): Promise<VendaWithRelations[]> {
  return fetchAll<VendaWithRelations>(() => {
    let query = supabase
      .from('vendas')
      .select('*, clientes(nome, tipo), vendedores(nome)')
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })

    if (filters?.ano) query = query.eq('ano', filters.ano)
    if (filters?.mes) query = query.eq('mes', filters.mes)
    if (filters?.vendedor_id)
      query = query.eq('vendedor_id', filters.vendedor_id)
    if (filters?.tipo_cliente)
      query = query.eq('tipo_cliente', filters.tipo_cliente)
    if (filters?.status)
      query = query.eq(
        'status',
        filters.status as 'faturado' | 'pendente' | 'cancelado'
      )

    return query
  })
}

export async function getVendasSemClassificacao(): Promise<Venda[]> {
  return fetchAll<Venda>(() =>
    supabase
      .from('vendas')
      .select('*')
      .is('cliente_id', null)
      .order('created_at', { ascending: false }),
  )
}

export async function createVenda(
  venda: InsertTables<'vendas'>
): Promise<Venda> {
  const { data, error } = await supabase
    .from('vendas')
    .insert(venda)
    .select()
    .single()
  if (error) throw error
  return data as Venda
}

export async function updateVenda(
  id: string,
  venda: UpdateTables<'vendas'>
): Promise<Venda> {
  const { data, error } = await supabase
    .from('vendas')
    .update(venda)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Venda
}

export async function deleteVenda(id: string): Promise<void> {
  const { error } = await supabase.from('vendas').delete().eq('id', id)
  if (error) throw error
}
