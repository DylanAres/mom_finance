// ============================================================
//  资金账本配置 —— 你的 Google 表格
// ============================================================
// 你的表格链接（保留原样，方便日后查看）
export const SHEET_ID =
  'https://docs.google.com/spreadsheets/d/1hre1lac01yCaW6v4uAvSZJMfFh3K5spw52G8XnjvyLo/edit?gid=0#gid=0'

// 从上面的链接里自动提取出真正的表格编号和工作表编号
const SHEET_KEY = '1hre1lac01yCaW6v4uAvSZJMfFh3K5spw52G8XnjvyLo'
const GID = '0'

// 用于读取「公开表格」的标准接口（浏览器可直接跨域访问，返回 CSV 文本）
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_KEY}/gviz/tq?tqx=out:csv&gid=${GID}`

// 锁死的年化利率：4%
export const ANNUAL_RATE = 0.04

// ============================================================
//  数据类型
// ============================================================
export type LedgerChangeType = 'interest' | 'deposit' | 'withdraw'

export type LedgerRow = {
  date: string
  balance: number
  note: string
  principalSoFar: number // 截至这一行的累计本金
  change: number // 当前行与上一行的余额差；第一行等于初始余额
  type: LedgerChangeType
}

export type LedgerSummary = {
  rows: LedgerRow[]
  currentTotal: number // 当前总资产（最后一行余额）
  principal: number // 累计本金（实际投入）
  interest: number // 累计利息（总资产 - 本金）
}

// ============================================================
//  CSV 解析（支持带引号的字段，足够稳健）
// ============================================================
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      field = ''
      row = []
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

// 把 "285,000" / "285000" / "¥285000" 这种文本统一转成数字
function toNumber(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9.\-]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

// 备注含「利息」或「自动结算」都视为利息入账，不计入本金
function isInterestNote(note: string): boolean {
  return note.includes('利息') || note.includes('自动结算')
}

// ============================================================
//  把表格原始文本 -> 结构化数据 + 汇总计算
// ============================================================
export function parseLedger(csvText: string): LedgerSummary {
  const table = parseCSV(csvText)
  // 第一行是表头：日期 / 余额 / 操作
  const body = table.slice(1)

  const rows: LedgerRow[] = body.map((cols) => ({
    date: (cols[0] ?? '').trim(),
    balance: toNumber(cols[1] ?? ''),
    note: (cols[2] ?? '').trim(),
    principalSoFar: 0,
    change: 0,
    type: 'deposit',
  }))

  if (rows.length === 0) {
    return { rows: [], currentTotal: 0, principal: 0, interest: 0 }
  }

  // 【累计本金】每一行若备注不含「利息 / 自动结算」，就按余额变化增减本金。
  // 第一行没有上一笔，变动额等于当时余额。
  let principal = 0
  let prevBalance = 0
  for (let i = 0; i < rows.length; i++) {
    const change = rows[i].balance - prevBalance
    rows[i].change = change
    rows[i].type = isInterestNote(rows[i].note)
      ? 'interest'
      : change >= 0
        ? 'deposit'
        : 'withdraw'
    if (!isInterestNote(rows[i].note)) {
      principal += change // 存入为正、取出为负，自动加减
    }
    rows[i].principalSoFar = principal
    prevBalance = rows[i].balance
  }

  // 【当前总资产】最后一行的余额
  const currentTotal = rows[rows.length - 1].balance
  // 【累计利息】总资产 - 本金
  const interest = currentTotal - principal

  return { rows, currentTotal, principal, interest }
}

// ============================================================
//  复利预测：在「当前总资产」基础上，按 4% 年化滚 N 年
// ============================================================
export function projectTotal(currentTotal: number, years: number): number {
  return currentTotal * Math.pow(1 + ANNUAL_RATE, years)
}

export function parseLedgerDate(date: string): number | null {
  const normalized = date.trim().replace(/[./]/g, '-')
  const ts = Date.parse(normalized)
  return Number.isFinite(ts) ? ts : null
}

export function addYears(ts: number, years: number): number {
  const next = new Date(ts)
  next.setFullYear(next.getFullYear() + years)
  return next.getTime()
}

export function formatChartDate(ts: number, mode: 'full' | 'month' | 'year' | 'today'): string {
  if (mode === 'today') return '今天'
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (mode === 'year') return `${y}`
  if (mode === 'month') return `${y}-${m}`
  return `${y}-${m}-${day}`
}

// 货币格式化：¥ + 千分位 + 两位小数
export function formatCNY(value: number): string {
  return (
    '¥' +
    value.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}
