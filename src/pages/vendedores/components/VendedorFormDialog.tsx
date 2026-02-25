import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateVendedor, useUpdateVendedor } from '@/hooks/useVendedores'
import {
  vendedorSchema,
  type VendedorFormData,
} from '@/lib/validations/vendedor'
import type { Tables } from '@/lib/types/database'

type Vendedor = Tables<'vendedores'>

interface VendedorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendedor: Vendedor | null
}

export function VendedorFormDialog({
  open,
  onOpenChange,
  vendedor,
}: VendedorFormDialogProps) {
  const isEditing = !!vendedor
  const createMutation = useCreateVendedor()
  const updateMutation = useUpdateVendedor()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendedorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vendedorSchema) as any,
  })

  const statusValue = watch('status')

  useEffect(() => {
    if (open) {
      if (vendedor) {
        reset({
          nome: vendedor.nome,
          email: vendedor.email ?? '',
          status: vendedor.status,
          meta_mensal: vendedor.meta_mensal,
        })
      } else {
        reset({
          nome: '',
          email: '',
          status: 'ativo',
          meta_mensal: null,
        })
      }
    }
  }, [open, vendedor, reset])

  async function onSubmit(data: VendedorFormData) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: vendedor.id,
          data: {
            nome: data.nome,
            email: data.email || null,
            status: data.status,
            meta_mensal: data.meta_mensal ?? null,
          },
        })
        toast.success('Vendedor atualizado')
      } else {
        await createMutation.mutateAsync({
          nome: data.nome,
          email: data.email || null,
          status: data.status,
          meta_mensal: data.meta_mensal ?? null,
        })
        toast.success('Vendedor criado')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao criar vendedor')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Vendedor' : 'Novo Vendedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register('nome')}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusValue ?? 'ativo'}
                onValueChange={(v) =>
                  setValue('status', v as 'ativo' | 'inativo', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_mensal">Meta Mensal (R$)</Label>
              <Input
                id="meta_mensal"
                type="number"
                step="0.01"
                placeholder="75000"
                {...register('meta_mensal', { valueAsNumber: true })}
                className={errors.meta_mensal ? 'border-destructive' : ''}
              />
              {errors.meta_mensal && (
                <p className="text-xs text-destructive">
                  {errors.meta_mensal.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Salvar Vendedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
