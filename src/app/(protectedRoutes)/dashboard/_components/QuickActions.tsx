'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, AppWindow, Database, Store, Upload } from 'lucide-react'
import Link from 'next/link'
import type { ComponentType } from 'react'

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: ComponentType<{ className?: string }>
  variant?: 'default' | 'outline' | 'secondary'
}

const actions: QuickAction[] = [
  {
    id: 'onboarding',
    title: 'Complete onboarding',
    description: 'Pick up where you left off in the setup wizard.',
    href: '/onboarding',
    icon: Upload,
    variant: 'default',
  },
  {
    id: 'datasets',
    title: 'Upload training data',
    description: 'Send documents to power your tenant-specific AI models.',
    href: '/datasets',
    icon: Database,
    variant: 'outline',
  },
  {
    id: 'marketplace',
    title: 'Publish an offering',
    description: 'List a new service or software package in the marketplace.',
    href: '/marketplace',
    icon: Store,
    variant: 'outline',
  },
  {
    id: 'portal-preview',
    title: 'Preview customer portal',
    description: 'See what your subscribers experience end-to-end.',
    href: '/preview',
    icon: AppWindow,
    variant: 'secondary',
  },
]

const QuickActions = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.id} href={action.href} className="group block">
            <div
              className={cn(
                'flex items-start justify-between gap-4 rounded-xl border bg-card p-4 transition hover:shadow-lg',
                'border-dashed'
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Icon className="h-4 w-4" />
                  {action.title}
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <Button variant={action.variant ?? 'default'} size="icon" className="shrink-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default QuickActions
