import { useState } from 'react'
import { AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useVendedoresForTabs,
  useClientesForTransfer,
  useTransferirCliente,
} from '@/hooks/useCarteiras'
import { useAuth } from '@/contexts/AuthContext'

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedClienteId?: string
}

export function TransferModal({
  open,
  onOpenChange,
  preselectedClienteId,
}: TransferModalProps) {
  const { user } = useAuth()
  const { data: clientes } = useClientesForTransfer()
  const { data: vendedores } = useVendedoresForTabs()
  const transferMutation = useTransferirCliente()

  const [clienteId, setClienteId] = useState(preselectedClienteId ?? '')
  const [novoVendedorId, setNovoVendedorId] = useState('')
  const [motivo, setMotivo] = useState('')

  // Derive current vendedor from selected client
  const selectedCliente = clientes?.find((c) => c.id === clienteId)
  const vendedorAtual = vendedores?.find(
    (v) => v.id === selectedCliente?.vendedor_id
  )

  // Reset state when dialog opens
  useState(() => {
    if (open) {
      setClienteId(preselectedClienteId ?? '')
      setNovoVendedorId('')
      setMotivo('')
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || !novoVendedorId) {
      toast.error('Selecione cliente e novo vendedor')
      return
    }
    if (novoVendedorId === selectedCliente?.vendedor_id) {
      toast.error('Novo vendedor deve ser diferente do atual')
      return
    }

    try {
      await transferMutation.mutateAsync({
        cliente_id: clienteId,
        vendedor_anterior_id: selectedCliente?.vendedor_id ?? null,
        vendedor_novo_id: novoVendedorId,
        motivo,
        aprovado_por: user?.id ?? null,
      })
      toast.success('Cliente transferido com sucesso')
      onOpenChange(false)
    } catch {
      toast.error('Erro ao transferir cliente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="h-1.5 w-full bg-[#0066FF]" />
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-[#0066FF]" />
              Transferir Cliente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Cliente para Transferência</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Vendedor Atual</Label>
                <div className="h-12 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium text-sm">
                  {vendedorAtual?.nome ?? '(sem vendedor)'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Novo Vendedor</Label>
                <Select value={novoVendedorId} onValueChange={setNovoVendedorId}>
                  <SelectTrigger className="h-12 border-slate-200 ring-[#0066FF]">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores
                      ?.filter((v) => v.id !== selectedCliente?.vendedor_id)
                      .map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo" className="font-bold text-slate-700">Motivo da Alteração</Label>
              <textarea
                id="motivo"
                rows={2}
                placeholder="Descreva o motivo desta transferência para histórico..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="flex w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-1"
              />
            </div>

            {/* Warning Premium */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-900 uppercase">Atenção Crítica</p>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Esta ação transfere o histórico completo de vendas e a responsabilidade da carteira.
                  O registro será imutável no log de auditoria.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-slate-100 font-bold"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0066FF] hover:bg-[#0052CC] shadow-lg shadow-[#0066FF]/20 font-bold px-8 h-12"
                disabled={
                  transferMutation.isPending || !clienteId || !novoVendedorId
                }
              >
                {transferMutation.isPending
                  ? 'Processando...'
                  : 'Confirmar Transferência'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
