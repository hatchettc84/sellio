import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  TenantSummary,
  TenantSummaryDataset,
  TenantSummaryMetric,
  TenantSummaryOnboarding,
  TenantSummaryActivity,
} from '@/lib/types/tenant'
import WidgetCard from './WidgetCard'
import QuickActions from './QuickActions'
import { ArrowUpRight, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'

const fallbackSummary: TenantSummary = {
  tenantId: 'fallback-tenant',
  tenantName: 'Demo Tenant',
  onboarding: {
    totalSteps: 3,
    completedSteps: 1,
    percentComplete: 33,
    steps: [
      {
        id: 'subscription',
        title: 'Configure billing & seats',
        description: 'Activate billing, seats, and compliance policies.',
        status: 'completed',
      },
      {
        id: 'domain',
        title: 'Connect training data source',
        description: 'Upload core documents to power tenant experiences.',
        status: 'in_progress',
      },
      {
        id: 'marketplace',
        title: 'Publish first marketplace offering',
        description: 'Launch a service or software bundle in the marketplace.',
        status: 'pending',
      },
    ],
  },
  datasets: [
    { id: 'ds-001', name: 'Customer playbooks', status: 'Processing', badgeVariant: 'secondary' },
    { id: 'ds-002', name: 'Sales scripts', status: 'Ready', badgeVariant: 'default' },
    { id: 'ds-003', name: 'Product docs', status: 'Queued', badgeVariant: 'outline' },
  ],
  marketplace: {
    metrics: [
      { id: 'gmv', label: 'Monthly GMV', value: '$8,420', delta: '+12.6%', deltaTrend: 'positive' },
      { id: 'buyers', label: 'Active buyers', value: '37', delta: '+4 new', deltaTrend: 'positive' },
      { id: 'conversion', label: 'Conversion rate', value: '28%', delta: '+2.1 pts', deltaTrend: 'positive' },
    ],
  },
  activity: [
    { id: 'log-1', title: 'ACME Health uploaded 12 PDF documents', timestamp: '12 minutes ago' },
    { id: 'log-2', title: 'New marketplace purchase pending approval', timestamp: '38 minutes ago' },
    { id: 'log-3', title: 'Onboarding checklist reminder sent to Bluewave Inc.', timestamp: '2 hours ago' },
  ],
}

const OnboardingProgress = ({ onboarding }: { onboarding: TenantSummaryOnboarding }) => {
  const completed = onboarding.completedSteps ?? 0
  const total = onboarding.totalSteps || onboarding.steps.length || 1
  const percent = onboarding.percentComplete ?? Math.round((completed / total) * 100)

  return (
    <WidgetCard
      title="Onboarding progress"
      description="Track how close you are to fully activating this tenant."
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/onboarding">View checklist</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completed} of {total} steps complete
            </span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {onboarding.steps.map((step) => {
            const badgeVariant =
              step.status === 'completed' ? 'default' : step.status === 'in_progress' ? 'secondary' : 'outline'
            const label =
              step.status === 'completed' ? 'done' : step.status === 'in_progress' ? 'in progress' : 'pending'

            return (
              <li key={step.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant={badgeVariant} className="capitalize">
                  {label}
                </Badge>
              </li>
            )
          })}
        </ul>
      </div>
    </WidgetCard>
  )
}

const DatasetOverview = ({ datasets }: { datasets: TenantSummaryDataset[] }) => {
  return (
    <WidgetCard
      title="Training datasets"
      description="Monitor ingestion status and freshness."
      action={
        <Button asChild size="sm">
          <Link href="/datasets">Manage</Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{dataset.name}</p>
              <p className="text-xs text-muted-foreground">ID: {dataset.id}</p>
            </div>
            <Badge variant={dataset.badgeVariant ?? 'outline'}>{dataset.status}</Badge>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

const MarketplaceOverview = ({ metrics }: { metrics: TenantSummaryMetric[] }) => {
  return (
    <WidgetCard
      title="Marketplace performance"
      description="Snapshot of revenue and growth signals."
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/marketplace">See analytics</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => {
          const deltaClass =
            metric.deltaTrend === 'negative'
              ? 'text-destructive'
              : metric.deltaTrend === 'positive'
                ? 'text-emerald-500'
                : 'text-muted-foreground'

          return (
            <div key={metric.id} className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
              <p className={cn('text-xs', deltaClass)}>{metric.delta}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Promote a featured bundle</p>
          <p className="text-xs text-muted-foreground">Curate offerings by industry to unlock higher conversion.</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/marketplace/create" className="flex items-center gap-1">
            Create bundle
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </WidgetCard>
  )
}

const ActivityTimeline = ({ activity }: { activity: TenantSummaryActivity[] }) => {
  return (
    <WidgetCard
      title="Recent activity"
      description="High-signal events across your tenants."
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/activity">View all</Link>
        </Button>
      }
    >
      <ul className="space-y-4">
        {activity.map((event) => (
          <li key={event.id} className="space-y-1 border-l-2 border-primary/40 pl-4">
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">{event.timestamp}</p>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}

interface DashboardHighlightsProps {
  tenantName?: string | null
  summary?: TenantSummary | null
  isLoading?: boolean
}

const DashboardHighlights = ({ tenantName, summary, isLoading }: DashboardHighlightsProps) => {
  const resolvedSummary = summary ?? fallbackSummary
  const resolvedTenantName = tenantName ?? summary?.tenantName ?? fallbackSummary.tenantName
  const containerClass = cn('space-y-6', isLoading ? 'opacity-60 pointer-events-none select-none' : '')

  return (
    <div className={containerClass} aria-busy={isLoading} aria-live="polite">
      <section className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-background p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Tenant overview
          </div>
          <h1 className="text-2xl font-semibold">
            {resolvedTenantName ? `Welcome back to ${resolvedTenantName}` : 'Tenant command center'}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage onboarding, monitor ingestion health, and launch new offerings from a single view designed for
            multi-tenant operations.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" asChild>
              <Link href="/marketplace/create" className="flex items-center gap-1">
                Launch new offering
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/reports">View reports</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/settings">Tenant settings</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <OnboardingProgress onboarding={resolvedSummary.onboarding} />
        <DatasetOverview datasets={resolvedSummary.datasets} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MarketplaceOverview metrics={resolvedSummary.marketplace.metrics} />
        <ActivityTimeline activity={resolvedSummary.activity} />
      </section>

      <section className="rounded-2xl border p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Quick actions
          </div>
          <QuickActions />
        </div>
      </section>
    </div>
  )
}

export default DashboardHighlights
