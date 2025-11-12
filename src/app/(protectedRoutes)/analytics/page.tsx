'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getWebinarAnalytics,
  getRevenueAnalytics,
  getAIPerformanceAnalytics,
  type WebinarAnalytics,
  type RevenueAnalytics,
  type AIPerformanceAnalytics,
} from '@/action/analytics'
import { Loader2, TrendingUp, Users, DollarSign, BarChart3, Phone, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const AnalyticsPage = () => {
  const [webinarAnalytics, setWebinarAnalytics] = useState<WebinarAnalytics | null>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null)
  const [aiAnalytics, setAiAnalytics] = useState<AIPerformanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const [webinarRes, revenueRes, aiRes] = await Promise.all([
          getWebinarAnalytics(),
          getRevenueAnalytics(),
          getAIPerformanceAnalytics(),
        ])

        if (webinarRes.status === 200 && webinarRes.analytics) {
          setWebinarAnalytics(webinarRes.analytics)
        } else {
          setError(webinarRes.error || 'Failed to load webinar analytics')
        }

        if (revenueRes.status === 200 && revenueRes.analytics) {
          setRevenueAnalytics(revenueRes.analytics)
        }

        if (aiRes.status === 200 && aiRes.analytics) {
          setAiAnalytics(aiRes.analytics)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your webinar performance, revenue, and AI agent effectiveness
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/webinars">View Webinars</Link>
        </Button>
      </div>

      {/* Overview Cards */}
      {webinarAnalytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Webinars</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webinarAnalytics.totalWebinars}</div>
              <p className="text-xs text-muted-foreground">
                {webinarAnalytics.liveWebinars} live, {webinarAnalytics.scheduledWebinars} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webinarAnalytics.totalAttendees}</div>
              <p className="text-xs text-muted-foreground">
                Avg {webinarAnalytics.averageAttendeesPerWebinar} per webinar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webinarAnalytics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Across all webinars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${webinarAnalytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performing Webinars */}
      {webinarAnalytics && webinarAnalytics.topPerformingWebinars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Webinars</CardTitle>
            <CardDescription>Your best performing webinars by conversions and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webinarAnalytics.topPerformingWebinars.map((webinar) => (
                <div
                  key={webinar.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{webinar.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{webinar.attendees} attendees</span>
                      <span>{webinar.conversions} conversions</span>
                      <span className="text-emerald-500">{webinar.conversionRate.toFixed(1)}% rate</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${webinar.revenue.toLocaleString()}</div>
                    <Button asChild variant="link" size="sm">
                      <Link href={`/webinars/${webinar.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Performance */}
      {aiAnalytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                AI Agent Performance
              </CardTitle>
              <CardDescription>Performance metrics for your AI agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{aiAnalytics.totalCalls}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{aiAnalytics.completedCalls}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{aiAnalytics.callCompletionRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{aiAnalytics.conversionFromCalls.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
              <CardDescription>Revenue metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueAnalytics && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ${revenueAnalytics.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold">
                        ${revenueAnalytics.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg per Webinar</p>
                      <p className="text-2xl font-bold">
                        ${revenueAnalytics.averageRevenuePerWebinar.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Growth</p>
                      <p
                        className={`text-2xl font-bold ${
                          revenueAnalytics.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-destructive'
                        }`}
                      >
                        {revenueAnalytics.revenueGrowth >= 0 ? '+' : ''}
                        {revenueAnalytics.revenueGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Calls by Webinar */}
      {aiAnalytics && aiAnalytics.callsByWebinar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Calls by Webinar</CardTitle>
            <CardDescription>Call performance breakdown by webinar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiAnalytics.callsByWebinar.map((webinar) => (
                <div
                  key={webinar.webinarId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{webinar.webinarTitle}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{webinar.totalCalls} total calls</span>
                      <span>{webinar.completedCalls} completed</span>
                      <span>{webinar.conversions} conversions</span>
                    </div>
                  </div>
                  <Button asChild variant="link" size="sm">
                    <Link href={`/webinars/${webinar.webinarId}`}>View Details</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AnalyticsPage

