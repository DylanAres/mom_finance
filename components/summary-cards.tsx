'use client'

import { Card } from '@/components/ui/card'
import { formatCNY } from '@/lib/finance'

type Props = {
  total: number
  principal: number
  interest: number
  timeMode: 'today' | 'future' | 'past'
  horizonLabel: string
}

export function SummaryCards({
  total,
  principal,
  interest,
  timeMode,
  horizonLabel,
}: Props) {
  const totalLabel =
    timeMode === 'today'
      ? '当前总资产'
      : timeMode === 'future'
        ? `${horizonLabel} · 预计总资产`
        : `${horizonLabel} · 当时总资产`
  const interestLabel =
    timeMode === 'future' ? '预计利息' : timeMode === 'past' ? '当时利息' : '累计利息'

  const cards = [
    {
      emoji: '💰',
      label: totalLabel,
      value: total,
      highlight: true,
    },
    {
      emoji: '📥',
      label: '累计本金',
      value: principal,
      highlight: false,
    },
    {
      emoji: '📈',
      label: interestLabel,
      value: interest,
      highlight: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={[
            'flex flex-col gap-3 p-6 transition-all duration-500',
            c.highlight
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-card',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {c.emoji}
            </span>
            <span
              className={[
                'text-sm font-medium',
                c.highlight
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground',
              ].join(' ')}
            >
              {c.label}
            </span>
          </div>
          <p className="font-heading text-3xl font-bold tracking-tight tabular-nums text-balance">
            {formatCNY(c.value)}
          </p>
        </Card>
      ))}
    </div>
  )
}
