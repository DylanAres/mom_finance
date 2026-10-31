'use client'

import { RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatYearMonth } from '@/lib/finance'

const YEAR_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20] as const
const MONTH_MIN = 1
const MONTH_MAX = 12
const MONTH_SPAN = MONTH_MAX - MONTH_MIN
const MONTH_TICKS = [3, 6, 9] as const

type Props = {
  originYear: number
  originMonth: number
  originDate: string
  year: number
  month: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onReset: () => void
}

export function ForecastSlider({
  originYear,
  originMonth,
  originDate,
  year,
  month,
  onYearChange,
  onMonthChange,
  onReset,
}: Props) {
  const isToday = year === originYear && month === originMonth
  const label = isToday ? '今天' : formatYearMonth(year, month)

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">时间</h2>
          <p className="text-sm text-muted-foreground">
            下拉选择年份，拖动滑块选择月份
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-3xl font-bold tabular-nums text-primary">
              {label}
            </p>
            {isToday ? (
              <p className="text-sm tabular-nums text-muted-foreground">
                {originDate}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={isToday}
            aria-label="重置到今天"
          >
            <RotateCcw />
            回到今天
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex w-full flex-col gap-1.5 sm:w-40">
          <span className="text-xs text-muted-foreground">年份</span>
          <select
            value={year}
            onChange={(e) => onYearChange(Number.parseInt(e.target.value, 10))}
            aria-label="年份"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {YEAR_OFFSETS.map((offset) => (
              <option key={offset} value={originYear + offset}>
                {originYear + offset}
              </option>
            ))}
          </select>
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">月份</span>
          <div>
            <div className="relative">
              <Slider
                value={[month]}
                min={MONTH_MIN}
                max={MONTH_MAX}
                step={1}
                onValueChange={(v) => {
                  const next = Array.isArray(v) ? v[0] : v
                  if (typeof next === 'number' && Number.isFinite(next)) {
                    onMonthChange(
                      Math.max(MONTH_MIN, Math.min(MONTH_MAX, Math.round(next))),
                    )
                  }
                }}
                aria-label="月份"
                className="[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:shadow-md"
              />
              <div className="pointer-events-none absolute inset-x-[14px] inset-y-0">
                {MONTH_TICKS.map((tick) => (
                  <span
                    key={`dot-${tick}`}
                    className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      month >= tick
                        ? 'bg-primary-foreground'
                        : 'bg-muted-foreground/40'
                    }`}
                    style={{ left: `${((tick - MONTH_MIN) / MONTH_SPAN) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="relative mx-[14px] mt-2 h-4">
              {MONTH_TICKS.map((tick) => (
                <span
                  key={`label-${tick}`}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-xs leading-4 text-muted-foreground tabular-nums"
                  style={{ left: `${((tick - MONTH_MIN) / MONTH_SPAN) * 100}%` }}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
