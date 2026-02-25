import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, SortableHeader } from '@/components/tables/DataTable'
import { ClienteFormDialog } from './components/ClienteFormDialog'
import {
  useClientes,
  useDeleteCliente,
} from '@/hooks/useClientes'
import { CLIENT_TYPES } from '@/lib/constants'
import { TYPE_LABEL, TYPE_BADGE_COLORS } from '@/lib/theme-constants'
import type { ClienteWithVendedor } from '@/services/api/clientes'



export function ClientesPage() {
  const navigate = useNavigate()
  const { data: clientes, isLoading } = useClientes()
  const deleteMutation = useDeleteCliente()

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteWithVendedor | null>(null)

  const filtered = useMemo(() => {
    if (!clientes) return []
    return clientes.filter((c) => {
      const matchSearch =
        !search ||
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.cnpj?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo
      const matchStatus = filterStatus === 'todos' || c.status === filterStatus
      return matchSearch && matchTipo && matchStatus
    })
  }, [clientes, search, filterTipo, filterStatus])

  function handleEdit(cliente: ClienteWithVendedor) {
    setEditingCliente(cliente)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingCliente(null)
    setDialogOpen(true)
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir cliente "${nome}"?`)) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(`Cliente "${nome}" excluído`),
      onError: () => toast.error('Erro ao excluir cliente'),
    })
  }

  const columns: ColumnDef<ClienteWithVendedor>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <SortableHeader column={column}>Nome</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('nome')}</span>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as string
        const color = TYPE_BADGE_COLORS[tipo]
        const badgeClass = color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
          color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
            color === 'teal' ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400' :
              'bg-muted text-muted-foreground'
        return (
          <Badge variant="outline" className={badgeClass}>
            {TYPE_LABEL[tipo] ?? tipo}
          </Badge>
        )
      },
    },
    {
      id: 'vendedor',
      header: 'Vendedor',
      cell: ({ row }) => {
        const v = row.original.vendedores
        return <span className="text-muted-foreground">{v?.nome ?? '—'}</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge
            variant="outline"
            className={
              status === 'ativo'
                ? 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }
          >
            {status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('email') || '—'}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => {
        const c = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/clientes/${c.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(c)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(c.id, c.nome)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">
            {clientes?.length ?? 0} clientes cadastrados
          </p>
        </div>
        <Button className="gap-2 bg-[#0066FF] hover:bg-[#0052CC] shadow-lg shadow-[#0066FF]/20" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 flex-1 max-w-sm">
          <label className="text-xs font-medium text-muted-foreground">Busca</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} />

      {/* Form Dialog */}
      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={editingCliente}
      />
    </div>
  )
}
