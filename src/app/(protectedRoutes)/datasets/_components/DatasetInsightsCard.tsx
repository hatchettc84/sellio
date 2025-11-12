import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TenantSummaryDataset } from '@/lib/types/tenant'
import { ArrowUpRight, BookOpenCheck, Layers, Stars } from 'lucide-react'
import Link from 'next/link'

interface DatasetInsightsCardProps {
  datasets: TenantSummaryDataset[]
}

const DatasetInsightsCard = ({ datasets }: DatasetInsightsCardProps) => {
  const readyDatasets = datasets.filter((dataset) => dataset.status.toLowerCase() === 'ready')
  const needsReviewDatasets = datasets.filter((dataset) => dataset.status.toLowerCase() !== 'ready')

  const insights = [
    {
      id: 'ready-insight',
      icon: Stars,
      title: `${readyDatasets.length} dataset${readyDatasets.length === 1 ? '' : 's'} production-ready`,
      description: 'Connect these to marketplace offerings to start monetizing the tenant knowledge base.',
      href: '/marketplace/create',
      badge: readyDatasets.length > 0 ? 'Action recommended' : 'Pending',
    },
    {
      id: 'review-insight',
      icon: BookOpenCheck,
      title: `${needsReviewDatasets.length} dataset${needsReviewDatasets.length === 1 ? ' requires' : 's require'} review`,
      description: 'Re-upload or repair datasets currently queued or processing to unblock AI workflows.',
      href: '/datasets/history',
      badge: needsReviewDatasets.length > 0 ? 'Attention needed' : 'All clear',
    },
    {
      id: 'bundle-insight',
      icon: Layers,
      title: 'Bundle datasets with AI automations',
      description: 'Combine curated documents with spotlight automations to launch new services faster.',
      href: '/automations',
      badge: 'New',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights & next steps</CardTitle>
        <CardDescription>Recommendations generated from current dataset signals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const Icon = insight.icon

          return (
            <div key={insight.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {insight.badge}
                </Badge>
                <Link href={insight.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Review
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default DatasetInsightsCard
