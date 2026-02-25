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
import {
  useCreateCliente,
  useUpdateCliente,
  useVendedoresForSelect,
} from '@/hooks/useClientes'
import { clienteSchema, type ClienteFormData } from '@/lib/validations/cliente'
import { CLIENT_TYPES } from '@/lib/constants'
import type { ClienteWithVendedor } from '@/services/api/clientes'

interface ClienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: ClienteWithVendedor | null
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
}: ClienteFormDialogProps) {
  const isEditing = !!cliente
  const { data: vendedores } = useVendedoresForSelect()
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  })

  const tipoValue = watch('tipo')
  const vendedorValue = watch('vendedor_id')

  useEffect(() => {
    if (open) {
      if (cliente) {
        reset({
          nome: cliente.nome,
          tipo: cliente.tipo,
          vendedor_id: cliente.vendedor_id,
          cnpj: cliente.cnpj ?? '',
          telefone: cliente.telefone ?? '',
          email: cliente.email ?? '',
          notas: cliente.notas ?? '',
        })
      } else {
        reset({
          nome: '',
          tipo: undefined,
          vendedor_id: null,
          cnpj: '',
          telefone: '',
          email: '',
          notas: '',
        })
      }
    }
  }, [open, cliente, reset])

  async function onSubmit(data: ClienteFormData) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: cliente.id,
          data: {
            nome: data.nome,
            tipo: data.tipo,
            vendedor_id: data.vendedor_id ?? null,
            cnpj: data.cnpj || null,
            telefone: data.telefone || null,
            email: data.email || null,
            notas: data.notas || null,
          },
        })
        toast.success('Cliente atualizado')
      } else {
        await createMutation.mutateAsync({
          nome: data.nome,
          tipo: data.tipo,
          vendedor_id: data.vendedor_id ?? null,
          cnpj: data.cnpj || null,
          telefone: data.telefone || null,
          email: data.email || null,
          notas: data.notas || null,
        })
        toast.success('Cliente criado')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao criar cliente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Gerais */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              Dados Gerais
            </legend>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={tipoValue ?? ''}
                  onValueChange={(v) =>
                    setValue('tipo', v as ClienteFormData['tipo'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={errors.tipo ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <p className="text-xs text-destructive">
                    {errors.tipo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Vendedor Responsável</Label>
                <Select
                  value={vendedorValue ?? ''}
                  onValueChange={(v) =>
                    setValue('vendedor_id', v || null, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register('cnpj')}
              />
            </div>
          </fieldset>

          {/* Contato */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              Contato
            </legend>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  {...register('telefone')}
                />
              </div>
            </div>
          </fieldset>

          {/* Observações */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              Observações
            </legend>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                rows={3}
                placeholder="Informações adicionais sobre o cliente..."
                {...register('notas')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </fieldset>

          {/* Actions */}
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
                  : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
