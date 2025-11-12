import type { Application, Request, Response } from 'express'
import { Router } from 'express'

type DatasetRecord = {
  id: string
  name: string
  status: string
  badgeVariant: 'default' | 'secondary' | 'outline'
  documents?: number
  lastUpdated?: string
}

type OnboardingStepRecord = {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
}

type MarketplaceMetricRecord = {
  id: string
  label: string
  value: string
  delta: string
  deltaTrend: 'positive' | 'negative' | 'neutral'
}

type ActivityRecord = {
  id: string
  title: string
  timestamp: string
}

const demoDatasets: DatasetRecord[] = [
  {
    id: 'ds-001',
    name: 'Customer playbooks',
    status: 'Processing',
    badgeVariant: 'secondary',
    documents: 12,
    lastUpdated: '12 minutes ago',
  },
  {
    id: 'ds-002',
    name: 'Sales scripts',
    status: 'Ready',
    badgeVariant: 'default',
    documents: 34,
    lastUpdated: 'Yesterday',
  },
  {
    id: 'ds-003',
    name: 'Product docs',
    status: 'Queued',
    badgeVariant: 'outline',
    documents: 7,
    lastUpdated: '5 minutes ago',
  },
]

const demoOnboardingSteps: OnboardingStepRecord[] = [
  {
    id: 'subscription',
    title: 'Activate subscription',
    description: 'Configure billing preferences, seats, and SLA commitments.',
    status: 'completed',
  },
  {
    id: 'domain',
    title: 'Configure domain & branding',
    description: 'Set up custom domain, branding, and communication settings.',
    status: 'in_progress',
  },
  {
    id: 'datasets',
    title: 'Upload training datasets',
    description: 'Upload PDFs and documents for tenant-specific AI features.',
    status: 'pending',
  },
]

const demoMarketplaceMetrics: MarketplaceMetricRecord[] = [
  { id: 'gmv', label: 'Monthly GMV', value: '$8,420', delta: '+12.6%', deltaTrend: 'positive' },
  { id: 'buyers', label: 'Active buyers', value: '37', delta: '+4 new', deltaTrend: 'positive' },
  { id: 'conversion', label: 'Conversion rate', value: '28%', delta: '+2.1 pts', deltaTrend: 'positive' },
]

const demoActivityLog: ActivityRecord[] = [
  {
    id: 'log-1',
    title: 'ACME Health uploaded 12 PDF documents',
    timestamp: '12 minutes ago',
  },
  {
    id: 'log-2',
    title: 'New marketplace purchase pending approval',
    timestamp: '38 minutes ago',
  },
  {
    id: 'log-3',
    title: 'Onboarding checklist reminder sent to Bluewave Inc.',
    timestamp: '2 hours ago',
  },
]

export function registerTenantRoutes(app: Application) {
  const router = Router()

  router.get('/summary', (req: Request, res: Response) => {
    const tenantId = req.tenant?.id ?? 'unknown-tenant'
    const tenantName = req.tenant?.name ?? 'Demo Tenant'

    res.json({
      tenantId,
      tenantName,
      onboarding: {
        totalSteps: demoOnboardingSteps.length,
        completedSteps: demoOnboardingSteps.filter((step) => step.status === 'completed').length,
        percentComplete: Math.round(
          (demoOnboardingSteps.filter((step) => step.status === 'completed').length /
            (demoOnboardingSteps.length || 1)) *
            100,
        ),
        steps: demoOnboardingSteps,
      },
      datasets: demoDatasets,
      marketplace: {
        metrics: demoMarketplaceMetrics,
      },
      activity: demoActivityLog,
    })
  })

  router.get('/datasets', (_req: Request, res: Response) => {
    res.json({ datasets: demoDatasets })
  })

  router.get('/onboarding', (_req: Request, res: Response) => {
    res.json({
      totalSteps: demoOnboardingSteps.length,
      steps: demoOnboardingSteps,
    })
  })

  app.use('/v1/tenants', router)
}
