import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowUpRight, BarChart2, DollarSign, Info, Users } from 'lucide-react'
import Link from 'next/link'

const metrics = [
  {
    id: 'gmv',
    label: 'Gross merchandise volume',
    value: '$32.4K',
    delta: '+18.4%',
    description: 'Revenue attributable to offerings sold this month.',
    icon: DollarSign,
    trend: 'positive' as const,
  },
  {
    id: 'buyers',
    label: 'Active buyers',
    value: '112',
    delta: '+9 new',
    description: 'Tenants who completed at least one purchase this month.',
    icon: Users,
    trend: 'positive' as const,
  },
  {
    id: 'conversion',
    label: 'Catalog conversion rate',
    value: '31%',
    delta: '+3.2 pts',
    description: 'Percent of catalog visits that convert to purchases.',
    icon: BarChart2,
    trend: 'positive' as const,
  },
]

const insight = {
  title: 'Spotlight Opportunity',
  description:
    'Listings with end-to-end onboarding bundles convert 2.4x higher. Combine AI automations and dataset uploads to unlock growth.',
  href: '/marketplace/create',
}

const MarketplaceAnalytics = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Marketplace analytics</CardTitle>
          <CardDescription>Key trends from tenant purchasing behavior.</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <Info className="h-3 w-3" />
          Rolling 30 days
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const trendClass = cn(
              'text-xs font-medium',
              metric.trend === 'positive' ? 'text-emerald-500' : 'text-destructive'
            )

            return (
              <div key={metric.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3 text-primary" />
                  {metric.label}
                </div>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                <p className={trendClass}>{metric.delta}</p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.description}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border border-dashed p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Insight</span>
            <p className="text-sm font-semibold">{insight.title}</p>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
            <Link href={insight.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              Build spotlight bundle
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketplaceAnalytics
