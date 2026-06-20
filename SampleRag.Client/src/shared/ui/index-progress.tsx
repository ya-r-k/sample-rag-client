import { cn } from '../lib/cn'

type IndexProgressProps = {
  value?: number | null
  className?: string
  hideWhenZero?: boolean
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function IndexProgress({
  value,
  className,
  hideWhenZero = false,
}: IndexProgressProps) {
  if (value == null) {
    return null
  }

  const percentage = clampPercentage(value)

  if (hideWhenZero && percentage <= 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-[11px]', className)}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/70"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-sky-600 transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="shrink-0 font-medium text-sky-700 dark:text-sky-300">
        {percentage}%
      </span>
    </div>
  )
}
