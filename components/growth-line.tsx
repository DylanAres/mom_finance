'use client'

import { Card } from '@/components/ui/card'
import { formatCNY } from '@/lib/finance'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type GrowthPoint = {
  label: string
  principal: number // 本金
  interest: number // 利息
  total: number // 总额（本金 + 利息）
  future?: boolean
}

type Props = {
  data: GrowthPoint[]
}

const SERIES = [
  { key: 'principal', name: '本金', color: 'var(--color-chart-1)' },
  { key: 'interest', name: '利息', color: 'var(--color-chart-2)' },
] as const

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: GrowthPoint }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="flex flex-col gap-0.5 text-sm tabular-nums">
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: 'var(--color-chart-1)' }}
            />
            本金
          </span>
          <span>{formatCNY(p.principal)}</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: 'var(--color-chart-2)' }}
            />
            利息
          </span>
          <span>{formatCNY(p.interest)}</span>
        </li>
        <li className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1 font-semibold">
          <span>总额</span>
          <span>{formatCNY(p.total)}</span>
        </li>
      </ul>
    </div>
  )
}

export function GrowthLine({ data }: Props) {
  return (
    <Card className="flex flex-col gap-2 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">历史与未来资产增长</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        橙色为本金、绿色为利息，绿色越厚说明复利赚得越多
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPrincipal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.12} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) =>
                v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v}`
              }
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="principal"
              stackId="asset"
              name="本金"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#fillPrincipal)"
              isAnimationActive
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="asset"
              name="利息"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fill="url(#fillInterest)"
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
