'use server'

import { runTenantOperation } from '@/lib/tenant/auth'
import { onAuthenticateUser } from './auth'
import { AttendedTypeEnum, WebinarStatusEnum } from '@prisma/client'

export interface WebinarAnalytics {
  totalWebinars: number
  liveWebinars: number
  scheduledWebinars: number
  endedWebinars: number
  totalAttendees: number
  totalRevenue: number
  conversionRate: number
  averageAttendeesPerWebinar: number
  topPerformingWebinars: Array<{
    id: string
    title: string
    attendees: number
    conversions: number
    revenue: number
    conversionRate: number
  }>
}

export interface RevenueAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  averageRevenuePerWebinar: number
  revenueByWebinar: Array<{
    webinarId: string
    webinarTitle: string
    revenue: number
    attendees: number
    conversions: number
  }>
}

export interface AIPerformanceAnalytics {
  totalCalls: number
  completedCalls: number
  averageCallDuration: number
  callCompletionRate: number
  conversionFromCalls: number
  callsByWebinar: Array<{
    webinarId: string
    webinarTitle: string
    totalCalls: number
    completedCalls: number
    conversions: number
  }>
}

/**
 * Get comprehensive analytics for webinar creator
 */
export async function getWebinarAnalytics(): Promise<{
  status: number
  analytics?: WebinarAnalytics
  error?: string
}> {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const user = await onAuthenticateUser()
      if (!user.user) {
        return { status: 401, error: 'Unauthorized' }
      }

      const presenterId = user.user.id

      // Get all webinars for this presenter
      const webinars = await prisma.webinar.findMany({
        where: {
          presenterId,
          tenantId: context.tenantId,
        },
        include: {
          attendances: {
            include: {
              user: true,
            },
          },
        },
      })

      // Calculate metrics
      const totalWebinars = webinars.length
      const liveWebinars = webinars.filter((w) => w.webinarStatus === WebinarStatusEnum.LIVE).length
      const scheduledWebinars = webinars.filter((w) => w.webinarStatus === WebinarStatusEnum.SCHEDULED).length
      const endedWebinars = webinars.filter((w) => w.webinarStatus === WebinarStatusEnum.ENDED).length

      // Calculate attendees and conversions
      let totalAttendees = 0
      let totalConversions = 0
      const webinarPerformance: Array<{
        id: string
        title: string
        attendees: number
        conversions: number
        revenue: number
        conversionRate: number
      }> = []

      for (const webinar of webinars) {
        const attendees = webinar.attendances.length
        const conversions = webinar.attendances.filter(
          (a) => a.attendedType === AttendedTypeEnum.CONVERTED
        ).length

        totalAttendees += attendees
        totalConversions += conversions

        // Calculate revenue (this would come from Stripe in production)
        // For now, we'll estimate based on conversions and priceId
        const revenue = conversions * 0 // TODO: Calculate actual revenue from Stripe

        webinarPerformance.push({
          id: webinar.id,
          title: webinar.title,
          attendees,
          conversions,
          revenue,
          conversionRate: attendees > 0 ? (conversions / attendees) * 100 : 0,
        })
      }

      const conversionRate = totalAttendees > 0 ? (totalConversions / totalAttendees) * 100 : 0
      const averageAttendeesPerWebinar = totalWebinars > 0 ? totalAttendees / totalWebinars : 0

      // Sort by performance (conversions + revenue)
      const topPerformingWebinars = webinarPerformance
        .sort((a, b) => b.conversions + b.revenue - (a.conversions + a.revenue))
        .slice(0, 5)

      return {
        status: 200,
        analytics: {
          totalWebinars,
          liveWebinars,
          scheduledWebinars,
          endedWebinars,
          totalAttendees,
          totalRevenue: 0, // TODO: Calculate from Stripe
          conversionRate: Number(conversionRate.toFixed(2)),
          averageAttendeesPerWebinar: Number(averageAttendeesPerWebinar.toFixed(1)),
          topPerformingWebinars,
        },
      }
    })
  } catch (error) {
    console.error('Error getting webinar analytics:', error)
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    }
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(): Promise<{
  status: number
  analytics?: RevenueAnalytics
  error?: string
}> {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const user = await onAuthenticateUser()
      if (!user.user) {
        return { status: 401, error: 'Unauthorized' }
      }

      const presenterId = user.user.id

      // Get webinars with attendance data
      const webinars = await prisma.webinar.findMany({
        where: {
          presenterId,
          tenantId: context.tenantId,
        },
        include: {
          attendances: {
            where: {
              attendedType: AttendedTypeEnum.CONVERTED,
            },
          },
        },
      })

      // Calculate revenue metrics
      // TODO: Integrate with Stripe to get actual revenue data
      const totalRevenue = 0
      const monthlyRevenue = 0
      const revenueGrowth = 0

      const revenueByWebinar = webinars.map((webinar) => ({
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        revenue: 0, // TODO: Get from Stripe
        attendees: webinar.attendances.length,
        conversions: webinar.attendances.length,
      }))

      const averageRevenuePerWebinar =
        webinars.length > 0 ? totalRevenue / webinars.length : 0

      return {
        status: 200,
        analytics: {
          totalRevenue,
          monthlyRevenue,
          revenueGrowth,
          averageRevenuePerWebinar: Number(averageRevenuePerWebinar.toFixed(2)),
          revenueByWebinar,
        },
      }
    })
  } catch (error) {
    console.error('Error getting revenue analytics:', error)
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Failed to get revenue analytics',
    }
  }
}

/**
 * Get AI agent performance analytics
 */
export async function getAIPerformanceAnalytics(): Promise<{
  status: number
  analytics?: AIPerformanceAnalytics
  error?: string
}> {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const user = await onAuthenticateUser()
      if (!user.user) {
        return { status: 401, error: 'Unauthorized' }
      }

      const presenterId = user.user.id

      // Get webinars with AI agents
      const webinars = await prisma.webinar.findMany({
        where: {
          presenterId,
          tenantId: context.tenantId,
          aiAgentId: { not: null },
        },
        include: {
          attendances: {
            include: {
              user: true,
            },
          },
        },
      })

      let totalCalls = 0
      let completedCalls = 0
      const callsByWebinar: Array<{
        webinarId: string
        webinarTitle: string
        totalCalls: number
        completedCalls: number
        conversions: number
      }> = []

      for (const webinar of webinars) {
        // Count calls based on attendance types
        // BOOK_A_CALL attendees who have completed calls
        const calls = webinar.attendances.filter(
          (a) => a.user.callStatus === 'COMPLETED' || a.user.callStatus === 'IN_PROGRESS'
        ).length

        const completed = webinar.attendances.filter((a) => a.user.callStatus === 'COMPLETED').length
        const conversions = webinar.attendances.filter(
          (a) => a.attendedType === AttendedTypeEnum.CONVERTED
        ).length

        totalCalls += calls
        completedCalls += completed

        callsByWebinar.push({
          webinarId: webinar.id,
          webinarTitle: webinar.title,
          totalCalls: calls,
          completedCalls: completed,
          conversions,
        })
      }

      const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
      const conversionFromCalls = completedCalls > 0
        ? (callsByWebinar.reduce((sum, w) => sum + w.conversions, 0) / completedCalls) * 100
        : 0

      return {
        status: 200,
        analytics: {
          totalCalls,
          completedCalls,
          averageCallDuration: 0, // TODO: Get from Vapi API
          callCompletionRate: Number(callCompletionRate.toFixed(2)),
          conversionFromCalls: Number(conversionFromCalls.toFixed(2)),
          callsByWebinar,
        },
      }
    })
  } catch (error) {
    console.error('Error getting AI performance analytics:', error)
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Failed to get AI performance analytics',
    }
  }
}

