import { supabase } from '@/lib/supabase'
import type {
  ChurnPorAdministradora,
  ClienteChurn,
  ClienteNovo,
  ClienteComparacao,
  TopQueda,
  ComparacaoPorVendedor,
  ComparacaoPorTipo,
} from '@/lib/types/database'

export async function getChurnPorAdministradora(
  ano1: number, mes1: number,
  ano2: number, mes2: number
): Promise<ChurnPorAdministradora[]> {
  const { data, error } = await (supabase.rpc as any)('fn_churn_por_administradora', {
    p_ano1: ano1, p_mes1: mes1,
    p_ano2: ano2, p_mes2: mes2,
  })
  if (error) throw error
  return (data ?? []) as ChurnPorAdministradora[]
}

export async function getClientesChurn(
  anoRef: number, mesRef: number,
  anoAtual: number, mesAtual: number
): Promise<ClienteChurn[]> {
  const { data, error } = await (supabase.rpc as any)('fn_clientes_churn', {
    p_ano_ref: anoRef, p_mes_ref: mesRef,
    p_ano_atual: anoAtual, p_mes_atual: mesAtual,
  })
  if (error) throw error
  return (data ?? []) as ClienteChurn[]
}

export async function getClientesNovos(
  anoRef: number, mesRef: number,
  anoAtual: number, mesAtual: number
): Promise<ClienteNovo[]> {
  const { data, error } = await (supabase.rpc as any)('fn_clientes_novos', {
    p_ano_ref: anoRef, p_mes_ref: mesRef,
    p_ano_atual: anoAtual, p_mes_atual: mesAtual,
  })
  if (error) throw error
  return (data ?? []) as ClienteNovo[]
}

export async function getTopQuedas(
  ano1: number, mes1: number,
  ano2: number, mes2: number,
  limit = 5
): Promise<TopQueda[]> {
  const { data, error } = await (supabase.rpc as any)('fn_top_quedas', {
    p_ano1: ano1, p_mes1: mes1,
    p_ano2: ano2, p_mes2: mes2,
    p_limit: limit,
  })
  if (error) throw error
  return (data ?? []) as TopQueda[]
}

export async function getComparacaoPorVendedor(
  ano1: number, mes1: number,
  ano2: number, mes2: number
): Promise<ComparacaoPorVendedor[]> {
  const { data, error } = await (supabase.rpc as any)('fn_comparacao_por_vendedor', {
    p_ano1: ano1, p_mes1: mes1,
    p_ano2: ano2, p_mes2: mes2,
  })
  if (error) throw error
  return (data ?? []) as ComparacaoPorVendedor[]
}

export async function getClientesComparacao(
  ano1: number, mes1: number,
  ano2: number, mes2: number
): Promise<ClienteComparacao[]> {
  const { data, error } = await (supabase.rpc as any)('fn_clientes_comparacao', {
    p_ano1: ano1, p_mes1: mes1,
    p_ano2: ano2, p_mes2: mes2,
  })
  if (error) throw error
  return (data ?? []) as ClienteComparacao[]
}

export async function getComparacaoPorTipo(
  ano1: number, mes1: number,
  ano2: number, mes2: number
): Promise<ComparacaoPorTipo[]> {
  const { data, error } = await (supabase.rpc as any)('fn_comparacao_por_tipo', {
    p_ano1: ano1, p_mes1: mes1,
    p_ano2: ano2, p_mes2: mes2,
  })
  if (error) throw error
  return (data ?? []) as ComparacaoPorTipo[]
}
