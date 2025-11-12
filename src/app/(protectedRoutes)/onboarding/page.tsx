import { onAuthenticateUser } from '@/action/auth'
import { getOnboardingStatus } from '@/action/onboarding'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Circle, ArrowRight, CreditCard, Sparkles, Webcam, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const OnboardingPage = async () => {
  const checkUser = await onAuthenticateUser()
  if (!checkUser.user) {
    redirect('/sign-in')
  }

  const response = await getOnboardingStatus()
  if (response.status !== 200 || !response.steps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium">Unable to load onboarding status</p>
        </div>
      </div>
    )
  }

  const steps = response.steps
  const onboardingSteps = [
    {
      id: 1,
      title: 'Connect Stripe',
      description: 'Connect your Stripe account to start accepting payments from webinar attendees',
      link: '/settings',
      completed: steps.connectStripe,
      icon: CreditCard,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      title: 'Create AI Agent',
      description: 'Set up an AI agent to automate your webinar interactions and presentations',
      link: '/ai-agents',
      completed: steps.createAiAgent,
      icon: Sparkles,
      color: 'bg-purple-500',
    },
    {
      id: 3,
      title: 'Create a Webinar',
      description: 'Set up your first webinar to start collecting leads and generating revenue',
      link: '/webinars',
      completed: steps.createWebinar,
      icon: Webcam,
      color: 'bg-indigo-500',
    },
    {
      id: 4,
      title: 'Get Your First Lead',
      description: 'Have someone register for your webinar to start building your customer pipeline',
      link: '/lead',
      completed: steps.getLeads,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      id: 5,
      title: 'Convert a Lead',
      description: 'Convert your first lead into a paying customer through your webinar',
      link: '/customers/converted',
      completed: steps.conversionStatus,
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
  ]

  const completedCount = onboardingSteps.filter((step) => step.completed).length
  const totalSteps = onboardingSteps.length
  const progressPercentage = (completedCount / totalSteps) * 100

  const nextStep = onboardingSteps.find((step) => !step.completed)
  const allCompleted = completedCount === totalSteps

  return (
    <main className="space-y-6 py-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Getting Started</p>
        <h1 className="text-3xl font-semibold tracking-tight">Onboarding Checklist</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Complete these steps to set up your webinar platform and start generating revenue
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                {completedCount} of {totalSteps} steps completed
              </CardDescription>
            </div>
            <Badge variant={allCompleted ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          {allCompleted && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Check className="h-5 w-5" />
                <p className="font-medium">Congratulations! You&apos;ve completed all onboarding steps.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Step Highlight */}
      {nextStep && !allCompleted && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Next Step
            </CardTitle>
            <CardDescription>Continue your onboarding journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className={`${nextStep.color} rounded-lg p-3 text-white`}>
                <nextStep.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{nextStep.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{nextStep.description}</p>
                <Button asChild>
                  <Link href={nextStep.link}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Steps</h2>
        <div className="grid gap-4">
          {onboardingSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = !step.completed && index === onboardingSteps.findIndex((s) => !s.completed)

            return (
              <Card
                key={step.id}
                className={`transition-all ${
                  isActive ? 'border-primary shadow-md' : step.completed ? 'opacity-75' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number/Status */}
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <span className="text-lg font-semibold">{step.id}</span>
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`${step.color} rounded-lg p-2 text-white`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            {step.completed && (
                              <Badge variant="outline" className="text-xs">
                                Completed
                              </Badge>
                            )}
                            {isActive && (
                              <Badge variant="default" className="text-xs">
                                Next
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                        </div>
                      </div>

                      {!step.completed && (
                        <Button asChild variant={isActive ? 'default' : 'outline'}>
                          <Link href={step.link}>
                            {isActive ? 'Start Now' : 'Go to Step'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access key features of your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard">
                <Circle className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/integrations">
                <Sparkles className="mr-2 h-4 w-4" />
                Integrations
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/settings">
                <CreditCard className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default OnboardingPage

