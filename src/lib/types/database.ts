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
