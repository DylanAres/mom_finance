'use client'

import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  formatCNY,
  formatLedgerDate,
  type LedgerChangeType,
  type LedgerRow,
} from '@/lib/finance'

type FilterKey = 'all' | LedgerChangeType
type SortOrder = 'desc' | 'asc'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'interest', label: '利息' },
  { key: 'deposit', label: '存入' },
  { key: 'withdraw', label: '取出' },
]

const TYPE_META: Record<
  LedgerChangeType,
  { label: string; badgeClass: string }
> = {
  interest: {
    label: '利息',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  },
  deposit: {
    label: '存入',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  withdraw: {
    label: '取出',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300',
  },
}

function formatChangeAmount(value: number): string {
  const formatted = formatCNY(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

function changeAmountClass(row: LedgerRow): string {
  if (row.type === 'interest') return 'text-amber-600 dark:text-amber-400'
  if (row.change > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (row.change < 0) return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}

function extraNote(row: LedgerRow, meta: (typeof TYPE_META)[LedgerChangeType]) {
  const note = row.note.trim()
  if (!note) return null
  if (note === meta.label) return null
  return note
}

function TypeCell({
  row,
  meta,
}: {
  row: LedgerRow
  meta: (typeof TYPE_META)[LedgerChangeType]
}) {
  const note = extraNote(row, meta)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
      >
        {meta.label}
      </span>
      {note ? (
        <span className="text-sm text-muted-foreground">{note}</span>
      ) : null}
    </div>
  )
}

function BalanceCell({ row }: { row: LedgerRow }) {
  return (
    <>
      <div className="font-medium tabular-nums">{formatCNY(row.balance)}</div>
      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
        累计本金 {formatCNY(row.principalSoFar)}
      </div>
    </>
  )
}

function HistoryRowMobile({ row }: { row: LedgerRow }) {
  const meta = TYPE_META[row.type]
  return (
    <li className="flex flex-col gap-2 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm tabular-nums">{formatLedgerDate(row.date)}</span>
        <span
          className={`text-right font-medium tabular-nums ${changeAmountClass(row)}`}
        >
          {formatChangeAmount(row.change)}
        </span>
      </div>
      <TypeCell row={row} meta={meta} />
      <div className="text-right">
        <BalanceCell row={row} />
      </div>
    </li>
  )
}

type Props = {
  rows: LedgerRow[]
}

export function HistoryTable({ rows }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortOrder>('desc')

  const displayed = useMemo(() => {
    const filtered =
      filter === 'all' ? rows : rows.filter((row) => row.type === filter)
    return sort === 'desc' ? [...filtered].reverse() : filtered
  }, [rows, filter, sort])

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">历史资金变动明细</h2>
          <p className="text-sm text-muted-foreground">
            按时间查看每笔存取与利息
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          aria-label={sort === 'desc' ? '当前倒序，点击切换为正序' : '当前正序，点击切换为倒序'}
          title={sort === 'desc' ? '最新在上' : '最早在上'}
        >
          {sort === 'desc' ? (
            <ArrowDownWideNarrow />
          ) : (
            <ArrowUpNarrowWide />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={filter === item.key ? 'default' : 'outline'}
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          暂无符合条件的记录
        </p>
      ) : (
        <>
          <ul className="flex max-h-[calc(6.5rem*10)] flex-col divide-y divide-border/60 overflow-y-auto overscroll-contain sm:hidden">
            {displayed.map((row, index) => (
              <HistoryRowMobile
                key={`${row.date}-${row.balance}-${index}`}
                row={row}
              />
            ))}
          </ul>

          <div className="hidden max-h-[calc(4.25rem*10+2.75rem)] overflow-auto overscroll-contain sm:block">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="bg-card pb-3 pr-4 font-medium">日期</th>
                  <th className="bg-card pb-3 pr-4 font-medium">变动原因</th>
                  <th className="bg-card pb-3 pr-4 text-right font-medium">
                    本次变动金额
                  </th>
                  <th className="bg-card pb-3 text-right font-medium">
                    变动后总余额
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row, index) => {
                  const meta = TYPE_META[row.type]
                  return (
                    <tr
                      key={`${row.date}-${row.balance}-${index}`}
                      className="border-b border-border/60 last:border-b-0"
                    >
                      <td className="py-3.5 pr-4 align-top text-sm tabular-nums">
                        {formatLedgerDate(row.date)}
                      </td>
                      <td className="py-3.5 pr-4 align-top">
                        <TypeCell row={row} meta={meta} />
                      </td>
                      <td
                        className={`py-3.5 pr-4 text-right align-top font-medium tabular-nums ${changeAmountClass(row)}`}
                      >
                        {formatChangeAmount(row.change)}
                      </td>
                      <td className="py-3.5 text-right align-top">
                        <BalanceCell row={row} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
