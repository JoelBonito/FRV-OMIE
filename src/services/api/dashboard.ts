import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/types/database'

type ResumoGlobal = Views<'v_resumo_global'>
type VendasPorVendedor = Views<'v_vendas_por_vendedor'>
type CarteiraDetalhada = Views<'v_carteira_detalhada'>
type AdministradorasMensal = Views<'v_administradoras_mensal'>
type ClientesInativos = Views<'v_clientes_inativos'>

export async function getResumoGlobal(ano?: number): Promise<ResumoGlobal[]> {
  let query = supabase.from('v_resumo_global').select('*')
  if (ano) query = query.eq('ano', ano)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ResumoGlobal[]
}

export async function getVendasPorVendedor(
  ano?: number,
  mes?: number
): Promise<VendasPorVendedor[]> {
  let query = supabase.from('v_vendas_por_vendedor').select('*')
  if (ano) query = query.eq('ano', ano)
  if (mes) query = query.eq('mes', mes)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as VendasPorVendedor[]
}

export async function getCarteiraDetalhada(
  vendedorId?: string
): Promise<CarteiraDetalhada[]> {
  let query = supabase.from('v_carteira_detalhada').select('*')
  if (vendedorId) query = query.eq('vendedor_id', vendedorId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CarteiraDetalhada[]
}

export async function getAdministradorasMensal(): Promise<
  AdministradorasMensal[]
> {
  const { data, error } = await supabase
    .from('v_administradoras_mensal')
    .select('*')
  if (error) throw error
  return (data ?? []) as AdministradorasMensal[]
}

export async function getClientesInativos(): Promise<ClientesInativos[]> {
  const { data, error } = await supabase
    .from('v_clientes_inativos')
    .select('*')
  if (error) throw error
  return (data ?? []) as ClientesInativos[]
}
