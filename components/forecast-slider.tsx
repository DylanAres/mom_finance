'use client'

import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

type Props = {
  years: number
  onChange: (years: number) => void
}

export function ForecastSlider({ years, onChange }: Props) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">未来时间滑块</h2>
          <p className="text-sm text-muted-foreground">
            拖动滑块，预览未来复利增长
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-bold tabular-nums text-primary">
            {years === 0 ? '今天' : `第 ${years} 年`}
          </p>
        </div>
      </div>

      <div className="relative py-1">
        <Slider
          value={[years]}
          min={0}
          max={30}
          step={1}
          onValueChange={(v) => {
            // base-ui 单滑块时回调可能是数字，也可能是数组，这里统一兜底
            const next = Array.isArray(v) ? v[0] : v
            if (typeof next === 'number' && Number.isFinite(next)) {
              onChange(next)
            }
          }}
          aria-label="未来年数"
          className="[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:shadow-md"
        />
        {/* 刻度小点：每 5 年一个，方便对准拖动 */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
          {[0, 5, 10, 15, 20, 25, 30].map((tick) => (
            <span
              key={tick}
              className={`size-2 rounded-full ${
                years >= tick ? 'bg-primary-foreground' : 'bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>今天</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30 年</span>
      </div>
    </Card>
  )
}
