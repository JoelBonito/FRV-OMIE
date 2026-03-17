import { supabase } from '@/lib/supabase'
import { fetchAll } from '@/lib/supabase-helpers'

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
  return fetchAll<CurvaAbcValorItem>(() =>
    supabase
      .from('v_curva_abc_valor')
      .select('*')
      .order('ordem', { ascending: true }),
  )
}

export async function getCurvaAbcQuantidade(): Promise<CurvaAbcQuantidadeItem[]> {
  return fetchAll<CurvaAbcQuantidadeItem>(() =>
    supabase
      .from('v_curva_abc_quantidade')
      .select('*')
      .order('ordem', { ascending: true }),
  )
}
