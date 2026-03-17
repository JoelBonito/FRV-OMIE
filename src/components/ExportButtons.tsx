import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface ExportColumn {
  key: string
  header: string
  /** Optional formatter — receives the raw value and returns a display string */
  format?: (value: unknown) => string
}

interface ExportButtonsProps {
  data: Record<string, unknown>[]
  columns: ExportColumn[]
  title: string
  fileName: string
}

export function ExportButtons({ data, columns, title, fileName }: ExportButtonsProps) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleExportPdf() {
    if (data.length === 0) {
      toast.info('Nenhum dado para exportar')
      return
    }
    setLoadingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape' })

      // Header
      doc.setFontSize(14)
      doc.text(title, 14, 15)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — ${data.length} registros`, 14, 22)
      doc.setTextColor(0)

      // Table
      const headers = columns.map((c) => c.header)
      const rows = data.map((row) =>
        columns.map((col) => {
          const val = row[col.key]
          if (col.format) return col.format(val)
          if (val === null || val === undefined) return '—'
          return String(val)
        })
      )

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 255], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      })

      doc.save(`${fileName}.pdf`)
      toast.success('PDF exportado')
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Erro ao gerar PDF')
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleExportExcel() {
    if (data.length === 0) {
      toast.info('Nenhum dado para exportar')
      return
    }
    setLoadingXlsx(true)
    try {
      const XLSX = await import('xlsx')

      const wsData = [
        columns.map((c) => c.header),
        ...data.map((row) =>
          columns.map((col) => {
            const val = row[col.key]
            if (col.format) return col.format(val)
            if (val === null || val === undefined) return ''
            return val
          })
        ),
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Auto-size columns
      ws['!cols'] = columns.map((col) => {
        const maxLen = Math.max(
          col.header.length,
          ...data.map((row) => {
            const val = row[col.key]
            const formatted = col.format ? col.format(val) : String(val ?? '')
            return formatted.length
          })
        )
        return { wch: Math.min(maxLen + 2, 40) }
      })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dados')
      XLSX.writeFile(wb, `${fileName}.xlsx`)
      toast.success('Excel exportado')
    } catch (err) {
      console.error('Excel export error:', err)
      toast.error('Erro ao gerar Excel')
    } finally {
      setLoadingXlsx(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
        onClick={handleExportPdf}
        disabled={loadingPdf}
      >
        {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950/50 dark:hover:text-green-400 dark:hover:border-green-800 transition-colors"
        onClick={handleExportExcel}
        disabled={loadingXlsx}
      >
        {loadingXlsx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        Excel
      </Button>
    </div>
  )
}
