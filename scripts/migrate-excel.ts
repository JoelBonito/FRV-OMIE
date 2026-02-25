/**
 * Excel → Supabase Migration Script
 *
 * Reads RELATORIO COMPLETO VENDAS.xlsx and generates SQL insert statements
 * for the frv_omie schema (vendedores, clientes, vendas).
 *
 * Usage:
 *   npx tsx scripts/migrate-excel.ts
 *   npx tsx scripts/migrate-excel.ts --output sql
 *   npx tsx scripts/migrate-excel.ts --output json
 *
 * Output: scripts/output/migration_{timestamp}.sql (or .json)
 */

import * as XLSX from 'xlsx'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const XLSX_PATH = path.resolve(__dirname, '../docs/RELATORIO COMPLETO VENDAS.xlsx')
const OUTPUT_DIR = path.resolve(__dirname, 'output')

const TIPO_MAP: Record<string, string> = {
  administradora: 'administradora',
  adm: 'administradora',
  empresa: 'empresa',
  sindico: 'sindico',
  síndico: 'sindico',
  consumidor_final: 'consumidor_final',
  cf: 'consumidor_final',
  consumidor: 'consumidor_final',
}

const VENDEDORES_CONHECIDOS = ['Thalia', 'Gabriel', 'Mateus', 'Fabia', 'Fernanda']
const MESES_MAP: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface VendedorRow {
  nome: string
  email: string
  status: 'ativo' | 'inativo'
}

interface ClienteRow {
  nome: string
  tipo: string
  status: 'ativo' | 'inativo'
  vendedor_nome: string
  cnpj?: string
}

interface VendaRow {
  cliente_nome: string
  vendedor_nome: string
  valor: number
  mes: number
  ano: number
  tipo_cliente: string
  status: 'faturado' | 'pendente' | 'cancelado'
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function sanitize(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function parseNumeric(val: unknown): number {
  if (val === null || val === undefined) return 0
  const str = String(val)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function normalizeTipo(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return TIPO_MAP[lower] || 'administradora'
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''")
}

function detectMonth(header: string): { mes: number; ano: number } | null {
  const lower = header.toLowerCase().trim()
  // Formats: "jun/25", "jan/26", "jun 2025", "06/2025"
  for (const [abbr, mesNum] of Object.entries(MESES_MAP)) {
    const regex = new RegExp(`${abbr}[\\s/.-]*(\\d{2,4})`, 'i')
    const match = lower.match(regex)
    if (match) {
      let ano = parseInt(match[1])
      if (ano < 100) ano += 2000
      return { mes: mesNum, ano }
    }
  }
  // Try numeric: "06/25", "01/2026"
  const numMatch = lower.match(/(\d{1,2})[/.-](\d{2,4})/)
  if (numMatch) {
    const mes = parseInt(numMatch[1])
    let ano = parseInt(numMatch[2])
    if (ano < 100) ano += 2000
    if (mes >= 1 && mes <= 12) return { mes, ano }
  }
  return null
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
function main() {
  const outputFormat = process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1] || 'sql'
    : 'sql'

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`File not found: ${XLSX_PATH}`)
    console.error('Place "RELATORIO COMPLETO VENDAS.xlsx" in the docs/ folder.')
    process.exit(1)
  }

  console.log(`Reading: ${XLSX_PATH}`)
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true })
  console.log(`Sheets found: ${wb.SheetNames.join(', ')}`)

  const vendedores = new Map<string, VendedorRow>()
  const clientes = new Map<string, ClienteRow>()
  const vendas: VendaRow[] = []

  // Seed known vendedores
  for (const nome of VENDEDORES_CONHECIDOS) {
    vendedores.set(nome, {
      nome,
      email: `${nome.toLowerCase()}@frv.com.br`,
      status: nome === 'Fernanda' ? 'inativo' : 'ativo',
    })
  }

  // Process each sheet
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    if (data.length === 0) continue

    console.log(`\nProcessing sheet: "${sheetName}" (${data.length} rows)`)
    const headers = Object.keys(data[0])

    // Detect vendedor from sheet name (CARTEIRA THALIA, MATEUS, etc.)
    let sheetVendedor: string | null = null
    for (const v of VENDEDORES_CONHECIDOS) {
      if (sheetName.toUpperCase().includes(v.toUpperCase())) {
        sheetVendedor = v
        break
      }
    }

    // Detect month columns
    const monthColumns: { header: string; mes: number; ano: number }[] = []
    for (const h of headers) {
      const period = detectMonth(h)
      if (period) monthColumns.push({ header: h, ...period })
    }

    if (monthColumns.length > 0) {
      console.log(`  Month columns: ${monthColumns.map(m => `${m.header}(${m.mes}/${m.ano})`).join(', ')}`)
    }

    // Detect name column (first text column)
    const nameCol = headers.find(h => {
      const lower = h.toLowerCase()
      return lower.includes('nome') || lower.includes('administradora') ||
        lower.includes('cliente') || lower.includes('razão') ||
        lower.includes('razao') || lower === headers[0]
    }) || headers[0]

    // Detect tipo column
    const tipoCol = headers.find(h => h.toLowerCase().includes('tipo'))

    // Process rows
    for (const row of data) {
      const nome = sanitize(row[nameCol])
      if (!nome || nome === 'TOTAL' || nome.toUpperCase().includes('TOTAL')) continue

      // Determine tipo
      let tipo = 'administradora'
      if (tipoCol) {
        tipo = normalizeTipo(sanitize(row[tipoCol]))
      } else if (sheetName.toUpperCase().includes('ADM') || sheetName.toUpperCase().includes('ADMINISTRADORA')) {
        tipo = 'administradora'
      }

      // Detect status
      const isInativo = Object.values(row).some(v =>
        String(v).toUpperCase().includes('INATIVOU') ||
        String(v).toUpperCase().includes('INATIVO')
      )

      // Add client
      const vendedorNome = sheetVendedor || 'Thalia'
      if (!clientes.has(nome)) {
        clientes.set(nome, {
          nome,
          tipo,
          status: isInativo ? 'inativo' : 'ativo',
          vendedor_nome: vendedorNome,
        })
      }

      // Extract sales from month columns
      for (const mc of monthColumns) {
        const valor = parseNumeric(row[mc.header])
        if (valor > 0) {
          vendas.push({
            cliente_nome: nome,
            vendedor_nome: vendedorNome,
            valor,
            mes: mc.mes,
            ano: mc.ano,
            tipo_cliente: tipo,
            status: 'faturado',
          })
        }
      }
    }
  }

  // Deduplicate clients (same name from multiple sheets → keep first)
  console.log(`\n--- Summary ---`)
  console.log(`Vendedores: ${vendedores.size}`)
  console.log(`Clientes (dedup): ${clientes.size}`)
  console.log(`Vendas: ${vendas.length}`)

  // Generate output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

  if (outputFormat === 'json') {
    const output = {
      vendedores: Array.from(vendedores.values()),
      clientes: Array.from(clientes.values()),
      vendas,
    }
    const outPath = path.join(OUTPUT_DIR, `migration_${timestamp}.json`)
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
    console.log(`\nJSON written to: ${outPath}`)
  } else {
    const lines: string[] = [
      '-- =============================================================',
      '-- Auto-generated migration from Excel',
      `-- Source: ${path.basename(XLSX_PATH)}`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- Vendedores: ${vendedores.size} | Clientes: ${clientes.size} | Vendas: ${vendas.length}`,
      '-- =============================================================',
      '',
      '-- Vendedores',
    ]

    for (const [, v] of vendedores) {
      lines.push(
        `INSERT INTO frv_omie.vendedores (nome, email, status) VALUES ('${escapeSQL(v.nome)}', '${escapeSQL(v.email)}', '${v.status}') ON CONFLICT DO NOTHING;`
      )
    }

    lines.push('', '-- Clientes')
    for (const [, c] of clientes) {
      lines.push(
        `INSERT INTO frv_omie.clientes (nome, tipo, status, vendedor_id) VALUES ('${escapeSQL(c.nome)}', '${c.tipo}', '${c.status}', (SELECT id FROM frv_omie.vendedores WHERE nome = '${escapeSQL(c.vendedor_nome)}' LIMIT 1)) ON CONFLICT DO NOTHING;`
      )
    }

    lines.push('', '-- Vendas')
    for (const v of vendas) {
      lines.push(
        `INSERT INTO frv_omie.vendas (cliente_id, vendedor_id, valor, mes, ano, tipo_cliente, status) VALUES ((SELECT id FROM frv_omie.clientes WHERE nome = '${escapeSQL(v.cliente_nome)}' LIMIT 1), (SELECT id FROM frv_omie.vendedores WHERE nome = '${escapeSQL(v.vendedor_nome)}' LIMIT 1), ${v.valor.toFixed(2)}, ${v.mes}, ${v.ano}, '${v.tipo_cliente}', '${v.status}');`
      )
    }

    const outPath = path.join(OUTPUT_DIR, `migration_${timestamp}.sql`)
    fs.writeFileSync(outPath, lines.join('\n'))
    console.log(`\nSQL written to: ${outPath}`)
  }

  // Validation hints
  console.log('\n--- Validation ---')
  const janVendas = vendas.filter(v => v.mes === 1 && v.ano === 2026)
  const janTotal = janVendas.reduce((sum, v) => sum + v.valor, 0)
  console.log(`Jan/26 vendas: ${janVendas.length} records, total: R$ ${janTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Expected (PRD): R$ 200.292,58`)
  if (Math.abs(janTotal - 200292.58) < 1000) {
    console.log('PASS: Within tolerance')
  } else {
    console.log('WARN: Divergence detected — review data manually')
  }
}

main()
