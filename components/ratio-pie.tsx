'use client'

import { Card } from '@/components/ui/card'
import { formatCNY } from '@/lib/finance'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  principal: number
  interest: number
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)']

export function RatioPie({ principal, interest }: Props) {
  const data = [
    { name: '累计本金', value: Math.max(principal, 0) },
    { name: '复利利息', value: Math.max(interest, 0) },
  ]
  const sum = data[0].value + data[1].value

  return (
    <Card className="flex flex-col gap-2 p-6">
      <h2 className="font-heading text-lg font-semibold">本息占比</h2>
      <p className="text-sm text-muted-foreground">本金与利息在总资产中的比例</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={3}
              isAnimationActive
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => {
                const pct = sum > 0 ? ((v / sum) * 100).toFixed(1) : '0.0'
                return [`${formatCNY(v)}（${pct}%）`, name]
              }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                background: 'var(--color-popover)',
                color: 'var(--color-popover-foreground)',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: COLORS[i] }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium tabular-nums">
              {formatCNY(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
