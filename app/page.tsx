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
  addYears,
  type LedgerSummary,
  parseLedgerDate,
  projectTotal,
} from '@/lib/finance'

// 只请求我们自己的同源后端接口，由 Vercel 服务器在后台中转 Google 表格数据
const fetcher = async (url: string): Promise<LedgerSummary> => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? '读取数据失败')
  }
  return json as LedgerSummary
}

export default function Page() {
  const [years, setYears] = useState(0)

  const {
    data: summary,
    error,
    isLoading,
  } = useSWR<LedgerSummary>('/api/data', fetcher, {
    revalidateOnFocus: false,
  })

  // 根据滑块年数计算「展示用」的数值（复利预测）
  const view = useMemo(() => {
    if (!summary) return null
    // 兜底：确保 years 始终是 0~30 的有效整数，避免出现 undefined / NaN
    const safeYears = Number.isFinite(years) ? Math.max(0, Math.min(30, years)) : 0
    const total = projectTotal(summary.currentTotal, safeYears)
    const principal = summary.principal // 未来不再新增本金，保持不变
    const interest = total - principal

    // 折线图数据：历史记录 + 未来逐年预测，按真实时间戳落点
    let lastTs = 0
    const history: GrowthPoint[] = summary.rows.map((r, i) => {
      const parsed = parseLedgerDate(r.date)
      let ts = parsed ?? lastTs + 24 * 60 * 60 * 1000
      if (i > 0 && ts <= lastTs) ts = lastTs + 60 * 1000
      lastTs = ts
      return {
        label: r.date,
        ts,
        principal: r.principalSoFar,
        interest: Math.max(0, r.balance - r.principalSoFar),
        total: r.balance,
      }
    })
    const originTs = history[history.length - 1]?.ts ?? Date.now()
    const future: GrowthPoint[] = []
    for (let t = 1; t <= safeYears; t++) {
      const futureTotal = projectTotal(summary.currentTotal, t)
      future.push({
        label: `第${t}年`,
        ts: addYears(originTs, t),
        principal: summary.principal, // 未来不再新增本金，保持不变
        interest: Math.max(0, futureTotal - summary.principal),
        total: futureTotal,
        future: true,
      })
    }

    return {
      total,
      principal,
      interest,
      growth: [...history, ...future],
      safeYears,
    }
  }, [summary, years])

  const isFuture = (view?.safeYears ?? 0) > 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:py-12">
      {/* 头部 */}
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

      {/* 加载 / 错误状态 */}
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

      {/* 内容 */}
      {view && (
        <>
          <SummaryCards
            total={view.total}
            principal={view.principal}
            interest={view.interest}
            isFuture={isFuture}
            years={view.safeYears}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <RatioPie principal={view.principal} interest={view.interest} />
            <GrowthLine data={view.growth} />
          </div>

          <ForecastSlider years={years} onChange={setYears} />

          {summary && <HistoryTable rows={summary.rows} />}

          <p className="pb-2 text-center text-xs text-muted-foreground">
            预测基于「当前总资产 × (1 + 4%)^年数」的复利公式，仅供参考。
          </p>
        </>
      )}
    </main>
  )
}
