'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ForecastSlider } from '@/components/forecast-slider'
import { GrowthLine, type GrowthPoint } from '@/components/growth-line'
import { HistoryTable } from '@/components/history-table'
import { RatioPie } from '@/components/ratio-pie'
import { SummaryCards } from '@/components/summary-cards'
import {
  ANNUAL_RATE,
  calendarMonthsBetween,
  endOfMonth,
  formatChartDate,
  formatYearMonth,
  type LedgerSummary,
  parseLedgerDate,
  startOfLocalDay,
  startOfMonth,
  todayInChina,
  projectTotal,
} from '@/lib/finance'

const fetcher = async (url: string): Promise<LedgerSummary> => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? '读取数据失败')
  }
  return json as LedgerSummary
}

function buildHistoryPoints(summary: LedgerSummary): GrowthPoint[] {
  let lastTs = 0
  const history: GrowthPoint[] = summary.rows.map((r, i) => {
    const parsed = parseLedgerDate(r.date)
    let ts = parsed ?? lastTs + 24 * 60 * 60 * 1000
    if (i > 0 && ts <= lastTs) ts = lastTs + 60 * 1000
    lastTs = ts
    return {
      label: formatChartDate(ts, 'full'),
      ts,
      principal: r.principalSoFar,
      interest: Math.max(0, r.balance - r.principalSoFar),
      total: r.balance,
    }
  })
  if (history.length > 0) {
    const start = startOfLocalDay(history[0].ts)
    if (history[0].ts <= start) history[0].ts = start + 60 * 1000
    history.unshift({
      label: formatChartDate(start, 'full'),
      ts: start,
      principal: 0,
      interest: 0,
      total: 0,
    })
  }
  return history
}

export default function Page() {
  const [year, setYear] = useState<number | null>(null)
  const [month, setMonth] = useState<number | null>(null)

  const {
    data: summary,
    error,
    isLoading,
  } = useSWR<LedgerSummary>('/api/data', fetcher, {
    revalidateOnFocus: false,
  })

  const view = useMemo(() => {
    if (!summary) return null

    const today = todayInChina()
    const historyAll = buildHistoryPoints(summary)
    const lastHistory = historyAll[historyAll.length - 1]
    if (lastHistory && lastHistory.ts < today.ts) {
      historyAll.push({
        label: formatChartDate(today.ts, 'full'),
        ts: today.ts,
        principal: summary.principal,
        interest: summary.interest,
        total: summary.currentTotal,
      })
    }
    const originTs = today.ts
    const originYear = today.year
    const originMonth = today.month
    const viewYear = year ?? originYear
    const viewMonth = month ?? originMonth

    const targetStart = startOfMonth(viewYear, viewMonth)
    const targetEnd = endOfMonth(viewYear, viewMonth)
    const horizonMonths = (viewYear - originYear) * 12 + (viewMonth - originMonth)
    const isToday = horizonMonths === 0
    const isFuture = horizonMonths > 0
    const horizon = Math.max(0, horizonMonths) / 12
    const horizonLabel = isToday ? '今天' : formatYearMonth(viewYear, viewMonth)

    let total = 0
    let principal = 0
    let interest = 0

    if (isFuture) {
      total = projectTotal(summary.currentTotal, horizon)
      principal = summary.principal
      interest = total - principal
    } else {
      const asOf = historyAll.filter((p) => p.ts <= targetEnd)
      const last = asOf[asOf.length - 1]
      if (last) {
        total = last.total
        principal = last.principal
        interest = last.interest
      }
    }

    const growth: GrowthPoint[] = []
    if (isFuture) {
      growth.push(...historyAll)
      const seen = new Set<number>()
      const pushFuture = (ts: number, pointYear: number, pointMonth: number) => {
        if (ts <= originTs || ts > targetStart || seen.has(ts)) return
        seen.add(ts)
        const months = calendarMonthsBetween(
          originYear,
          originMonth,
          pointYear,
          pointMonth,
        )
        const futureTotal = projectTotal(summary.currentTotal, months / 12)
        growth.push({
          label: formatChartDate(ts, pointMonth === 1 ? 'year' : 'month'),
          ts,
          principal: summary.principal,
          interest: Math.max(0, futureTotal - summary.principal),
          total: futureTotal,
          future: true,
        })
      }
      for (let y = originYear + 1; y <= viewYear; y++) {
        pushFuture(startOfMonth(y, 1), y, 1)
      }
      pushFuture(targetStart, viewYear, viewMonth)
    } else {
      const visible = historyAll.filter((p) => p.ts <= targetEnd)
      if (visible.length === 0) {
        growth.push({
          label: formatChartDate(targetStart, 'month'),
          ts: targetStart,
          principal: 0,
          interest: 0,
          total: 0,
        })
      } else {
        growth.push(...visible)
        const last = visible[visible.length - 1]
        if (last.ts < targetStart) {
          growth.push({
            label: formatChartDate(targetStart, 'month'),
            ts: targetStart,
            principal: last.principal,
            interest: last.interest,
            total: last.total,
          })
        }
      }
    }

    return {
      total,
      principal,
      interest,
      growth,
      horizon,
      horizonLabel,
      timeMode: (isToday ? 'today' : isFuture ? 'future' : 'past') as
        | 'today'
        | 'future'
        | 'past',
      originTs,
      originYear,
      originMonth,
      viewYear,
      viewMonth,
    }
  }, [summary, year, month])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-balance">
            资金账本
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            <span aria-hidden="true">🔒</span>
            当前固定年化利率：{(ANNUAL_RATE * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-pretty text-muted-foreground">
          记录每笔资金往来，并按固定年化利率预测复利收益。
        </p>
      </header>

      {isLoading && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          正在读取表格数据…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error.message || '读取数据失败，请稍后重试。'}
        </div>
      )}

      {view && (
        <>
          <SummaryCards
            total={view.total}
            principal={view.principal}
            interest={view.interest}
            timeMode={view.timeMode}
            horizonLabel={view.horizonLabel}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <RatioPie principal={view.principal} interest={view.interest} />
            <GrowthLine data={view.growth} />
          </div>

          <ForecastSlider
            originYear={view.originYear}
            originMonth={view.originMonth}
            originDate={formatChartDate(view.originTs, 'full')}
            year={view.viewYear}
            month={view.viewMonth}
            onYearChange={(nextYear) => {
              setYear(nextYear)
              setMonth(nextYear === view.originYear ? view.originMonth : 1)
            }}
            onMonthChange={setMonth}
            onReset={() => {
              setYear(view.originYear)
              setMonth(view.originMonth)
            }}
          />

          {summary && <HistoryTable rows={summary.rows} />}

          <p className="pb-2 text-center text-xs text-muted-foreground">
            预测基于「当前总资产 × (1 + 4%)^年数」的复利公式，仅供参考。
          </p>
        </>
      )}
    </main>
  )
}
