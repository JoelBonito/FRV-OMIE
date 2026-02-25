import { z } from 'zod'

export const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['administradora', 'empresa', 'sindico', 'consumidor_final'], {
    error: 'Selecione o tipo de cliente',
  }),
  vendedor_id: z.string().uuid('Selecione um vendedor').nullable().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notas: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
