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
  useCreateVenda,
  useUpdateVenda,
  useClientesForSelect,
  useVendedoresForSelect,
} from '@/hooks/useVendas'
import { vendaSchema, type VendaFormData } from '@/lib/validations/venda'
import { CLIENT_TYPES, SALE_STATUSES, MONTHS } from '@/lib/constants'
import type { VendaWithRelations } from '@/services/api/vendas'

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

interface VendaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venda: VendaWithRelations | null
}

export function VendaFormDialog({
  open,
  onOpenChange,
  venda,
}: VendaFormDialogProps) {
  const isEditing = !!venda
  const { data: clientes } = useClientesForSelect()
  const { data: vendedores } = useVendedoresForSelect()
  const createMutation = useCreateVenda()
  const updateMutation = useUpdateVenda()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<VendaFormData>({ resolver: zodResolver(vendaSchema) as any })

  const clienteIdValue = watch('cliente_id')
  const vendedorIdValue = watch('vendedor_id')
  const tipoClienteValue = watch('tipo_cliente')
  const statusValue = watch('status')
  const mesValue = watch('mes')
  const anoValue = watch('ano')

  useEffect(() => {
    if (open) {
      if (venda) {
        reset({
          cliente_id: venda.cliente_id,
          vendedor_id: venda.vendedor_id,
          valor: venda.valor,
          mes: venda.mes,
          ano: venda.ano,
          tipo_cliente: venda.tipo_cliente,
          status: venda.status,
          data_venda: venda.data_venda ?? '',
          nota_fiscal: venda.nota_fiscal ?? '',
          observacao: venda.observacao ?? '',
        })
      } else {
        reset({
          cliente_id: undefined,
          vendedor_id: undefined,
          valor: undefined as unknown as number,
          mes: CURRENT_MONTH,
          ano: CURRENT_YEAR,
          tipo_cliente: '',
          status: 'faturado',
          data_venda: '',
          nota_fiscal: '',
          observacao: '',
        })
      }
    }
  }, [open, venda, reset])

  // Auto-fill tipo_cliente when cliente is selected
  useEffect(() => {
    if (clienteIdValue && clientes) {
      const c = clientes.find((cl) => cl.id === clienteIdValue)
      if (c) setValue('tipo_cliente', c.tipo, { shouldValidate: true })
    }
  }, [clienteIdValue, clientes, setValue])

  async function onSubmit(data: VendaFormData) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: venda.id,
          data: {
            cliente_id: data.cliente_id,
            vendedor_id: data.vendedor_id,
            valor: data.valor,
            mes: data.mes,
            ano: data.ano,
            tipo_cliente: data.tipo_cliente,
            status: data.status,
            data_venda: data.data_venda || null,
            nota_fiscal: data.nota_fiscal || null,
            observacao: data.observacao || null,
          },
        })
        toast.success('Venda atualizada')
      } else {
        await createMutation.mutateAsync({
          cliente_id: data.cliente_id,
          vendedor_id: data.vendedor_id,
          valor: data.valor,
          mes: data.mes,
          ano: data.ano,
          tipo_cliente: data.tipo_cliente,
          status: data.status,
          data_venda: data.data_venda || null,
          nota_fiscal: data.nota_fiscal || null,
          observacao: data.observacao || null,
        })
        toast.success('Venda registrada')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao registrar venda')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Venda' : 'Registrar Venda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cliente + Vendedor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={clienteIdValue ?? ''}
                onValueChange={(v) =>
                  setValue('cliente_id', v, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className={errors.cliente_id ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cliente_id && (
                <p className="text-xs text-destructive">
                  {errors.cliente_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vendedor *</Label>
              <Select
                value={vendedorIdValue ?? ''}
                onValueChange={(v) =>
                  setValue('vendedor_id', v, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className={errors.vendedor_id ? 'border-destructive' : ''}
                >
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
              {errors.vendedor_id && (
                <p className="text-xs text-destructive">
                  {errors.vendedor_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Valor + Período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('valor', { valueAsNumber: true })}
                className={errors.valor ? 'border-destructive' : ''}
              />
              {errors.valor && (
                <p className="text-xs text-destructive">
                  {errors.valor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mês *</Label>
              <Select
                value={String(mesValue ?? '')}
                onValueChange={(v) =>
                  setValue('mes', Number(v), { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano *</Label>
              <Select
                value={String(anoValue ?? '')}
                onValueChange={(v) =>
                  setValue('ano', Number(v), { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo + Status + NF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo Cliente</Label>
              <Select
                value={tipoClienteValue ?? ''}
                onValueChange={(v) =>
                  setValue('tipo_cliente', v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusValue ?? 'faturado'}
                onValueChange={(v) =>
                  setValue('status', v as VendaFormData['status'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
              <Input id="nota_fiscal" {...register('nota_fiscal')} />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <textarea
              id="observacao"
              rows={2}
              placeholder="Informações adicionais..."
              {...register('observacao')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

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
                  : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
