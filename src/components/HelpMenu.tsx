import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ExternalLink, FileSpreadsheet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { filterHelpMappings } from '@/lib/help-mappings'

interface HelpMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpMenu({ open, onOpenChange }: HelpMenuProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const groups = filterHelpMappings(search)

  function handleNavigate(route: string) {
    onOpenChange(false)
    setSearch('')
    navigate(route)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        {/* Premium header bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066FF] rounded-t-lg" />

        <DialogHeader className="pt-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-[#0066FF]" />
            Guia: Planilhas no Sistema
          </DialogTitle>
          <DialogDescription>
            Encontre onde cada aba das planilhas Excel aparece no sistema.
            Clique em &quot;Ir&quot; para navegar direto ao dado.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planilha, aba ou descricao..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum resultado para &quot;{search}&quot;
            </p>
          )}

          {groups.map((group) => {
            const Icon = group.icon
            return (
              <Card key={group.key} className="border-slate-200/70">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-[#0066FF]" />
                    {group.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0 space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono shrink-0"
                          >
                            {item.spreadsheet}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.tab}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-snug">
                          {item.description}
                        </p>
                        {item.extras && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {item.extras}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleNavigate(item.route)}
                      >
                        Ir
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Quick reference table */}
          {!search && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1 pb-2">
                <p className="font-semibold text-foreground mb-2">Resumo Rapido</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    ['Churn por administradora', 'Comparacao → Administradoras'],
                    ['Todos os clientes', 'Comparacao → Condominios'],
                    ['Clientes perdidos', 'Comparacao → Perdidos'],
                    ['Clientes novos', 'Comparacao → Novos'],
                    ['Top quedas', 'Dashboard → Card Top Quedas'],
                    ['Curva ABC por valor', 'Curva ABC → Por Valor'],
                    ['Curva ABC por quantidade', 'Curva ABC → Por Quantidade'],
                    ['Pipeline de pedidos', 'Orcamentos → Todos'],
                    ['Pedidos em execucao', 'Orcamentos → Em Execucao'],
                  ].map(([want, go]) => (
                    <div key={want} className="flex justify-between">
                      <span>{want}</span>
                      <span className="text-muted-foreground/70">→ {go}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
