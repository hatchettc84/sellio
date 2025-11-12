import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { TenantSummaryDataset } from '@/lib/types/tenant'
import type { ComponentType } from 'react'
import { Database, Gauge, Hourglass, ShieldCheck } from 'lucide-react'

const statusIconMap: Record<string, ComponentType<{ className?: string }>> = {
  Ready: ShieldCheck,
  Processing: Hourglass,
  Queued: Gauge,
}

interface DatasetStatusSummaryProps {
  datasets: TenantSummaryDataset[]
}

const DatasetStatusSummary = ({ datasets }: DatasetStatusSummaryProps) => {
  const totalDatasets = datasets.length
  const readyCount = datasets.filter((dataset) => dataset.status.toLowerCase() === 'ready').length
  const processingCount = datasets.filter((dataset) => dataset.status.toLowerCase() === 'processing').length
  const queuedCount = datasets.filter((dataset) => dataset.status.toLowerCase() === 'queued').length

  const readyPercent = totalDatasets === 0 ? 0 : Math.round((readyCount / totalDatasets) * 100)

  const summaryRows = [
    { label: 'Ready', count: readyCount, variant: 'default' as const },
    { label: 'Processing', count: processingCount, variant: 'secondary' as const },
    { label: 'Queued', count: queuedCount, variant: 'outline' as const },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Dataset status</CardTitle>
          <CardDescription>Breakdown by ingestion pipeline state.</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <Database className="h-3 w-3" />
          {totalDatasets} datasets
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{readyPercent}% ready for production</span>
            <span>
              {readyCount} / {totalDatasets}
            </span>
          </div>
          <Progress value={readyPercent} className="h-2" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryRows.map((row) => {
            const Icon = statusIconMap[row.label] ?? Database
            return (
              <div key={row.label} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {row.label}
                </div>
                <p className="mt-2 text-2xl font-semibold">{row.count}</p>
                <Badge variant={row.variant} className="mt-2">{row.count === 1 ? 'Dataset' : 'Datasets'}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default DatasetStatusSummary
