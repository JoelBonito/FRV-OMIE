import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type KpiColor = 'primary' | 'teal' | 'amber'

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  description?: string
  icon: LucideIcon
  loading?: boolean
  color?: KpiColor
}

const colorMap: Record<
  KpiColor,
  {
    gradient: string
    shadow: string
    glow: string
    trendBg: string
    trendText: string
    trendBorder: string
  }
> = {
  primary: {
    gradient: 'from-[#0066FF] to-[#0052CC]',
    shadow: 'shadow-[#0066FF]/30',
    glow: 'from-[#0066FF] to-[#3D8BFF]',
    trendBg: 'bg-blue-100/60 dark:bg-blue-900/30',
    trendText: 'text-[#0066FF] dark:text-[#3D8BFF]',
    trendBorder: 'border-blue-200/50 dark:border-blue-800',
  },
  teal: {
    gradient: 'from-[#00C896] to-[#00A37A]',
    shadow: 'shadow-[#00C896]/30',
    glow: 'from-[#00C896] to-[#33D3AB]',
    trendBg: 'bg-teal-100/60 dark:bg-teal-900/30',
    trendText: 'text-[#00C896] dark:text-[#33D3AB]',
    trendBorder: 'border-teal-200/50 dark:border-teal-800',
  },
  amber: {
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/30',
    glow: 'from-amber-400 to-amber-500',
    trendBg: 'bg-amber-100/60 dark:bg-amber-900/30',
    trendText: 'text-amber-600 dark:text-amber-400',
    trendBorder: 'border-amber-200/50 dark:border-amber-800',
  },
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  description,
  icon: Icon,
  loading,
  color = 'primary',
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-7 w-28 mt-4" />
          <Skeleton className="h-3 w-20 mt-1" />
        </CardContent>
      </Card>
    )
  }

  const isPositive = change !== undefined && change >= 0
  const palette = colorMap[color]

  return (
    <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-5">
        {/* Glow effect */}
        <div
          className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${palette.glow} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`}
        />

        {/* Top row: icon + trend badge */}
        <div className="flex items-start justify-between relative z-10">
          {/* Gradient icon */}
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${palette.gradient} text-white shadow-lg ${palette.shadow}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Trend badge */}
          {change !== undefined && (
            <span
              className={`flex items-center gap-1 text-xs font-bold ${palette.trendText} ${palette.trendBg} px-2.5 py-1 rounded-full border ${palette.trendBorder}`}
            >
              {isPositive ? '\u2197' : '\u2198'} {isPositive ? '+' : ''}
              {changeLabel ?? `${change.toFixed(1)}%`}
            </span>
          )}
        </div>

        {/* Value */}
        <p className="text-2xl font-bold tracking-tight mt-4 relative z-10 font-mono">
          {value}
        </p>

        {/* Title & Description */}
        <div className="mt-1 relative z-10">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          {description && (
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
