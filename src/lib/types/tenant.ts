export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed'

export interface TenantSummaryStep {
  id: string
  title: string
  description: string
  status: OnboardingStepStatus
}

export interface TenantSummaryOnboarding {
  totalSteps: number
  completedSteps: number
  percentComplete?: number
  steps: TenantSummaryStep[]
}

export interface TenantSummaryDataset {
  id: string
  name: string
  status: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
  documents?: number
  lastUpdated?: string
}

export interface TenantSummaryMetric {
  id: string
  label: string
  value: string
  delta: string
  deltaTrend?: 'positive' | 'negative' | 'neutral'
}

export interface TenantSummaryActivity {
  id: string
  title: string
  timestamp: string
}

export interface TenantSummary {
  tenantId: string
  tenantName?: string
  onboarding: TenantSummaryOnboarding
  datasets: TenantSummaryDataset[]
  marketplace: {
    metrics: TenantSummaryMetric[]
  }
  activity: TenantSummaryActivity[]
}
