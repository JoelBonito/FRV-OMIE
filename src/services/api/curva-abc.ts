import { supabase } from '@/lib/supabase'

export interface CurvaAbcItem {
  ordem: number
  descricao: string
  valor: number
  quantidade: number
  pedidos: number
  pct_participacao: number
  pct_acumulado: number
  abc: 'A' | 'B' | 'C'
}

export interface CurvaAbcValorItem extends CurvaAbcItem {
  valor_acumulado: number
}

export interface CurvaAbcQuantidadeItem extends CurvaAbcItem {
  qtd_acumulada: number
}

export async function getCurvaAbcValor(): Promise<CurvaAbcValorItem[]> {
  const { data, error } = await supabase
    .from('v_curva_abc_valor')
    .select('*')
    .order('ordem', { ascending: true })
  if (error) throw error
  return (data ?? []) as CurvaAbcValorItem[]
}

export async function getCurvaAbcQuantidade(): Promise<CurvaAbcQuantidadeItem[]> {
  const { data, error } = await supabase
    .from('v_curva_abc_quantidade')
    .select('*')
    .order('ordem', { ascending: true })
  if (error) throw error
  return (data ?? []) as CurvaAbcQuantidadeItem[]
}
