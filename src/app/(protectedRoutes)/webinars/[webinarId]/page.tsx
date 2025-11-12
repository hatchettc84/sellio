import { onAuthenticateUser } from '@/action/auth'
import { getWebinarById } from '@/action/webinar'
import { getWebinarAttendance } from '@/action/attendance'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Edit,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { WebinarStatusEnum } from '@prisma/client'
import WebinarStatusActions from './_components/WebinarStatusActions'
import WebinarStats from './_components/WebinarStats'
import WebinarScriptView from './_components/WebinarScriptView'

type Props = {
  params: Promise<{
    webinarId: string
  }>
}

const WebinarDetailPage = async ({ params }: Props) => {
  const { webinarId } = await params
  const checkUser = await onAuthenticateUser()

  if (!checkUser.user) {
    redirect('/sign-in')
  }

  const webinar = await getWebinarById(webinarId)

  if (!webinar) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Webinar not found</h2>
          <p className="text-muted-foreground">The webinar you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button asChild>
            <Link href="/webinars">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webinars
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Check if user is the presenter
  if (checkUser.user.id !== webinar.presenterId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Unauthorized</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to view this webinar.</p>
          <Button asChild>
            <Link href="/webinars">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webinars
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get attendance data for stats
  const attendanceData = await getWebinarAttendance(webinarId)

  const getStatusBadge = (status: WebinarStatusEnum) => {
    const variants: Record<WebinarStatusEnum, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      [WebinarStatusEnum.SCHEDULED]: { variant: 'default', label: 'Scheduled' },
      [WebinarStatusEnum.WAITING_ROOM]: { variant: 'default', label: 'Waiting Room' },
      [WebinarStatusEnum.LIVE]: { variant: 'default', label: 'Live' },
      [WebinarStatusEnum.ENDED]: { variant: 'secondary', label: 'Ended' },
      [WebinarStatusEnum.CANCELLED]: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const liveWebinarUrl = `/live-webinar/${webinar.id}`
  const pipelineUrl = `/webinars/${webinar.id}/pipeline`

  return (
    <main className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/webinars">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {getStatusBadge(webinar.webinarStatus)}
              <h1 className="text-3xl font-semibold tracking-tight">{webinar.title}</h1>
            </div>
          </div>
          {webinar.description && (
            <p className="text-muted-foreground max-w-3xl">{webinar.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={liveWebinarUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Live
            </Link>
          </Button>
          <WebinarStatusActions webinar={webinar} />
        </div>
      </div>

      {/* Quick Stats */}
      {attendanceData.data && <WebinarStats webinar={webinar} attendanceData={attendanceData.data} />}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="script">AI Script</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Webinar Details */}
            <Card>
              <CardHeader>
                <CardTitle>Webinar Details</CardTitle>
                <CardDescription>Basic information about your webinar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Start Time</span>
                  </div>
                  <p className="font-medium">{format(new Date(webinar.startTime), 'MMMM d, yyyy')}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time</span>
                  </div>
                  <p className="font-medium">{format(new Date(webinar.startTime), 'h:mm a')}</p>
                </div>
                {webinar.endTime && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>End Time</span>
                    </div>
                    <p className="font-medium">{format(new Date(webinar.endTime), 'h:mm a')}</p>
                  </div>
                )}
                {webinar.duration > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <p className="font-medium">{webinar.duration} minutes</p>
                  </div>
                )}
                {webinar.tags && webinar.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {webinar.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA & Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Call to Action</CardTitle>
                <CardDescription>How attendees can take action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>CTA Type</span>
                  </div>
                  <Badge variant="outline">{webinar.ctaType}</Badge>
                </div>
                {webinar.ctaLabel && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>CTA Label</span>
                    </div>
                    <p className="font-medium">{webinar.ctaLabel}</p>
                  </div>
                )}
                {webinar.priceId && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Price ID</span>
                    </div>
                    <p className="font-medium font-mono text-sm">{webinar.priceId}</p>
                  </div>
                )}
                {webinar.couponEnabled && webinar.couponCode && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Coupon Code</span>
                    </div>
                    <p className="font-medium font-mono">{webinar.couponCode}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Chat Locked</span>
                  </div>
                  <Badge variant={webinar.lockChat ? 'destructive' : 'outline'}>
                    {webinar.lockChat ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your webinar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={pipelineUrl}>
                    <Users className="mr-2 h-4 w-4" />
                    View Pipeline
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={liveWebinarUrl} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Live Webinar
                  </Link>
                </Button>
                {webinar.webinarStatus === WebinarStatusEnum.SCHEDULED && (
                  <Button asChild variant="outline">
                    <Link href={`/webinars?edit=${webinar.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Webinar
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Script Tab */}
        <TabsContent value="script">
          <WebinarScriptView webinar={webinar} />
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Customer Pipeline</CardTitle>
              <CardDescription>Track your leads through the conversion funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={pipelineUrl}>
                  <Users className="mr-2 h-4 w-4" />
                  Open Full Pipeline View
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Webinar Settings</CardTitle>
              <CardDescription>Configure webinar options and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Webinar Status</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(webinar.webinarStatus)}
                  <WebinarStatusActions webinar={webinar} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">AI Agent</p>
                {webinar.aiAgentId ? (
                  <p className="text-sm text-muted-foreground font-mono">{webinar.aiAgentId}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI agent assigned</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(webinar.createdAt), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              {webinar.updatedAt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(webinar.updatedAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default WebinarDetailPage
