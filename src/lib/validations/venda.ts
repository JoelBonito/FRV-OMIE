import { z } from 'zod'

export const vendaSchema = z.object({
  cliente_id: z.string().uuid('Selecione um cliente'),
  vendedor_id: z.string().uuid('Selecione um vendedor'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2020).max(2100),
  tipo_cliente: z.string().min(1, 'Tipo de cliente obrigatório'),
  status: z.enum(['faturado', 'pendente', 'cancelado']),
  data_venda: z.string().optional(),
  nota_fiscal: z.string().optional(),
  observacao: z.string().optional(),
})

export type VendaFormData = z.infer<typeof vendaSchema>
