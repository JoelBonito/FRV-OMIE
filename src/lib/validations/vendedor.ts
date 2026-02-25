import { z } from 'zod'

export const vendedorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.enum(['ativo', 'inativo']),
  meta_mensal: z.number().min(0, 'Meta deve ser positiva').nullable().optional(),
})

export type VendedorFormData = z.infer<typeof vendedorSchema>
