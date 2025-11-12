'use client'

import DashboardHighlights from './_components/DashboardHighlights'
import { useUser } from '@clerk/nextjs'
import { useMemo } from 'react'
import { useTenantSummary } from '@/hooks/useTenantSummary'
import { useTenantContext } from '@/hooks/useTenantContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 py-4">
      <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-52 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

const DashboardPage = () => {
  const { tenantId, tenantName, isLoaded } = useTenantContext()
  const { user, isLoaded: userLoaded } = useUser()

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useTenantSummary(tenantId)

  const greetingName = useMemo(() => {
    if (user?.firstName) {
      return user.firstName
    }

    if (user?.fullName) {
      return user.fullName.split(' ')[0]
    }

    return undefined
  }, [user?.firstName, user?.fullName])

  if (!isLoaded || !userLoaded) {
    return <DashboardSkeleton />
  }

  return (
    <main className="space-y-6 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Tenant dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {greetingName ? `Hello, ${greetingName}` : 'Welcome back'}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Get a command-center view of onboarding progress, dataset health, and marketplace revenue for
          your tenants.
        </p>
      </div>

      {summaryError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load tenant summary</AlertTitle>
          <AlertDescription>{summaryError}</AlertDescription>
        </Alert>
      ) : null}

      <DashboardHighlights
        tenantName={tenantName}
        summary={summary}
        isLoading={summaryLoading && !summary}
      />
    </main>
  )
}

export default DashboardPage
