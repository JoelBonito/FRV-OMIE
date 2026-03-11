export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  frv_omie: {
    Tables: {
      vendedores: {
        Row: {
          id: string
          omie_id: number | null
          auth_user_id: string | null
          nome: string
          email: string | null
          status: 'ativo' | 'inativo'
          meta_mensal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          omie_id?: number | null
          auth_user_id?: string | null
          nome: string
          email?: string | null
          status?: 'ativo' | 'inativo'
          meta_mensal?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          omie_id?: number | null
          auth_user_id?: string | null
          nome?: string
          email?: string | null
          status?: 'ativo' | 'inativo'
          meta_mensal?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          omie_id: number | null
          nome: string
          tipo: 'administradora' | 'empresa' | 'sindico' | 'consumidor_final'
          status: 'ativo' | 'inativo'
          vendedor_id: string | null
          cnpj: string | null
          telefone: string | null
          email: string | null
          notas: string | null
          administradora: string | null
          data_inativacao: string | null
          motivo_inativacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          omie_id?: number | null
          nome: string
          tipo: 'administradora' | 'empresa' | 'sindico' | 'consumidor_final'
          status?: 'ativo' | 'inativo'
          vendedor_id?: string | null
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          notas?: string | null
          administradora?: string | null
          data_inativacao?: string | null
          motivo_inativacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          omie_id?: number | null
          nome?: string
          tipo?: 'administradora' | 'empresa' | 'sindico' | 'consumidor_final'
          status?: 'ativo' | 'inativo'
          vendedor_id?: string | null
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          notas?: string | null
          administradora?: string | null
          data_inativacao?: string | null
          motivo_inativacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clientes_vendedor_id_fkey'
            columns: ['vendedor_id']
            isOneToOne: false
            referencedRelation: 'vendedores'
            referencedColumns: ['id']
          },
        ]
      }
      vendas: {
        Row: {
          id: string
          omie_id: number | null
          cliente_id: string
          vendedor_id: string
          valor: number
          mes: number
          ano: number
          data_venda: string | null
          tipo_cliente: string
          status: 'faturado' | 'pendente' | 'cancelado'
          nota_fiscal: string | null
          pedido_omie_id: number | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          omie_id?: number | null
          cliente_id: string
          vendedor_id: string
          valor: number
          mes: number
          ano: number
          data_venda?: string | null
          tipo_cliente: string
          status?: 'faturado' | 'pendente' | 'cancelado'
          nota_fiscal?: string | null
          pedido_omie_id?: number | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          omie_id?: number | null
          cliente_id?: string
          vendedor_id?: string
          valor?: number
          mes?: number
          ano?: number
          data_venda?: string | null
          tipo_cliente?: string
          status?: 'faturado' | 'pendente' | 'cancelado'
          nota_fiscal?: string | null
          pedido_omie_id?: number | null
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendas_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_vendedor_id_fkey'
            columns: ['vendedor_id']
            isOneToOne: false
            referencedRelation: 'vendedores'
            referencedColumns: ['id']
          },
        ]
      }
      carteira_historico: {
        Row: {
          id: string
          cliente_id: string
          vendedor_anterior_id: string | null
          vendedor_novo_id: string
          data_transferencia: string
          motivo: string | null
          aprovado_por: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          vendedor_anterior_id?: string | null
          vendedor_novo_id: string
          data_transferencia?: string
          motivo?: string | null
          aprovado_por?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          vendedor_anterior_id?: string | null
          vendedor_novo_id?: string
          data_transferencia?: string
          motivo?: string | null
          aprovado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'carteira_historico_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'carteira_historico_vendedor_anterior_id_fkey'
            columns: ['vendedor_anterior_id']
            isOneToOne: false
            referencedRelation: 'vendedores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'carteira_historico_vendedor_novo_id_fkey'
            columns: ['vendedor_novo_id']
            isOneToOne: false
            referencedRelation: 'vendedores'
            referencedColumns: ['id']
          },
        ]
      }
      config_omie: {
        Row: {
          id: string
          app_key: string
          app_secret: string
          webhook_secret: string | null
          ultimo_sync: string | null
          status_sync: string
          sync_interval_hours: number
        }
        Insert: {
          id?: string
          app_key: string
          app_secret: string
          webhook_secret?: string | null
          ultimo_sync?: string | null
          status_sync?: string
          sync_interval_hours?: number
        }
        Update: {
          id?: string
          app_key?: string
          app_secret?: string
          webhook_secret?: string | null
          ultimo_sync?: string | null
          status_sync?: string
          sync_interval_hours?: number
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          id: string
          omie_id: number
          cliente_id: string | null
          vendedor_id: string | null
          numero_pedido: string | null
          valor_total: number
          etapa: string | null
          status: string
          previsao_faturamento: string | null
          data_pedido: string | null
          tags: string[] | null
          observacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          omie_id: number
          cliente_id?: string | null
          vendedor_id?: string | null
          numero_pedido?: string | null
          valor_total?: number
          etapa?: string | null
          status?: string
          previsao_faturamento?: string | null
          data_pedido?: string | null
          tags?: string[] | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          omie_id?: number
          cliente_id?: string | null
          vendedor_id?: string | null
          numero_pedido?: string | null
          valor_total?: number
          etapa?: string | null
          status?: string
          previsao_faturamento?: string | null
          data_pedido?: string | null
          tags?: string[] | null
          observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pedidos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pedidos_vendedor_id_fkey'
            columns: ['vendedor_id']
            isOneToOne: false
            referencedRelation: 'vendedores'
            referencedColumns: ['id']
          },
        ]
      }
      pedido_itens: {
        Row: {
          id: string
          pedido_id: string
          produto_omie_id: number | null
          descricao: string | null
          quantidade: number
          valor_unitario: number
          valor_total: number
          unidade: string | null
        }
        Insert: {
          id?: string
          pedido_id: string
          produto_omie_id?: number | null
          descricao?: string | null
          quantidade?: number
          valor_unitario?: number
          valor_total?: number
          unidade?: string | null
        }
        Update: {
          id?: string
          pedido_id?: string
          produto_omie_id?: number | null
          descricao?: string | null
          quantidade?: number
          valor_unitario?: number
          valor_total?: number
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pedido_itens_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
        ]
      }
      sync_logs: {
        Row: {
          id: string
          tipo: string
          endpoint: string
          call_method: string | null
          status: string
          registros_processados: number
          registros_criados: number
          registros_atualizados: number
          erros: Json | null
          duracao_ms: number | null
          payload_resumo: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: string
          endpoint: string
          call_method?: string | null
          status: string
          registros_processados?: number
          registros_criados?: number
          registros_atualizados?: number
          erros?: Json | null
          duracao_ms?: number | null
          payload_resumo?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: string
          endpoint?: string
          call_method?: string | null
          status?: string
          registros_processados?: number
          registros_criados?: number
          registros_atualizados?: number
          erros?: Json | null
          duracao_ms?: number | null
          payload_resumo?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      v_resumo_global: {
        Row: {
          ano: number
          mes: number
          total_geral: number
          total_adm: number | null
          total_empresas: number | null
          total_sindicos: number | null
          total_cf: number | null
        }
        Relationships: []
      }
      v_vendas_por_vendedor: {
        Row: {
          ano: number
          mes: number
          vendedor_id: string
          vendedor: string
          total: number
          clientes_atendidos: number
        }
        Relationships: []
      }
      v_carteira_detalhada: {
        Row: {
          vendedor_id: string
          vendedor: string
          cliente_id: string
          cliente: string
          tipo: string
          ano: number
          mes: number
          valor: number
          media_cliente: number
        }
        Relationships: []
      }
      v_administradoras_mensal: {
        Row: {
          cliente_id: string
          administradora: string
          ano: number
          mes: number
          valor: number
          valor_mes_anterior: number | null
          possivel_inativo: boolean
        }
        Relationships: []
      }
      v_clientes_inativos: {
        Row: {
          id: string
          nome: string
          tipo: string
          vendedor: string | null
          ultimo_periodo: number | null
          ultima_compra: string | null
        }
        Relationships: []
      }
      config_omie_safe: {
        Row: {
          id: string
          sync_interval_hours: number
          status_sync: string
          ultimo_sync: string | null
          has_credentials: boolean
        }
        Relationships: []
      }
      v_curva_abc_valor: {
        Row: {
          ordem: number
          descricao: string
          valor: number
          quantidade: number
          pedidos: number
          pct_participacao: number
          valor_acumulado: number
          pct_acumulado: number
          abc: string
        }
        Relationships: []
      }
      v_curva_abc_quantidade: {
        Row: {
          ordem: number
          descricao: string
          quantidade: number
          valor: number
          pedidos: number
          pct_participacao: number
          qtd_acumulada: number
          pct_acumulado: number
          abc: string
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['frv_omie']['Tables']> =
  Database['frv_omie']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['frv_omie']['Tables']> =
  Database['frv_omie']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['frv_omie']['Tables']> =
  Database['frv_omie']['Tables'][T]['Update']
export type Views<T extends keyof Database['frv_omie']['Views']> =
  Database['frv_omie']['Views'][T]['Row']

// RPC function return types
export interface ChurnPorAdministradora {
  administradora: string
  condominios_mes1: number
  condominios_mes2: number
  retidos: number
  perdidos: number
  novos: number
  taxa_retencao: number
  faturamento_mes1: number
  faturamento_mes2: number
  delta_faturamento: number
  pedidos_mes1: number
  pedidos_mes2: number
}

export interface ClienteChurn {
  cliente_id: string
  nome: string
  tipo: string
  administradora: string | null
  vendedor: string | null
  vendedor_id: string | null
  valor_ref: number
  pedidos_ref: number
  ultima_emissao: string | null
}

export interface ClienteNovo {
  cliente_id: string
  nome: string
  tipo: string
  administradora: string | null
  vendedor: string | null
  vendedor_id: string | null
  valor_atual: number
  pedidos_atual: number
}

export interface ClienteComparacao {
  cliente_id: string
  nome: string
  tipo: string
  administradora: string | null
  vendedor: string | null
  vendedor_id: string | null
  faturamento_mes1: number
  faturamento_mes2: number
  pedidos_mes1: number
  pedidos_mes2: number
  delta_faturamento: number
  status: 'Retido' | 'Perdido' | 'Novo'
}

export interface TopQueda {
  administradora: string
  condominios_perdidos: number
  pedidos_perdidos: number
  valor_perdido: number
}

export interface ComparacaoPorVendedor {
  vendedor_id: string
  vendedor: string
  faturamento_mes1: number
  faturamento_mes2: number
  delta_faturamento: number
  clientes_mes1: number
  clientes_mes2: number
  pedidos_mes1: number
  pedidos_mes2: number
}

export interface ComparacaoPorTipo {
  tipo_cliente: string
  faturamento_mes1: number
  faturamento_mes2: number
  delta_faturamento: number
  clientes_mes1: number
  clientes_mes2: number
  pedidos_mes1: number
  pedidos_mes2: number
}
