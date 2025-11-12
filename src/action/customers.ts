'use server'

import { AttendedTypeEnum } from '@prisma/client'
import { runTenantOperation } from '@/lib/tenant/auth'

export const getCustomerJourney = async () => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const actorId = context.actorId
      if (!actorId) {
        return { status: 403, error: 'User not authorized' }
      }

      const currentUserRecord = await prisma.user.findUnique({
        where: {
          clerkId: actorId,
        },
        include: {
          tenantMemberships: {
            where: { tenantId: context.tenantId },
            select: { id: true },
          },
        },
      })

      if (!currentUserRecord) {
        return { status: 404, error: 'User not found' }
      }

      if (currentUserRecord.tenantMemberships.length === 0) {
        return { status: 403, error: 'User is not a member of this tenant' }
      }

      // Get all attendees for user's webinars with their journey stages
      const attendees = await prisma.attendee.findMany({
        where: {
          Attendance: {
            some: {
              webinar: {
                presenterId: currentUserRecord.id,
                tenantId: context.tenantId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          callStatus: true,
          createdAt: true,
          updatedAt: true,
          Attendance: {
          where: {
            webinar: {
              presenterId: currentUserRecord.id,
              tenantId: context.tenantId,
            },
          },
          select: {
            attendedType: true,
            joinedAt: true,
            webinarId: true,
            webinar: {
              select: {
                id: true,
                title: true,
                tags: true,
                startTime: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Group by journey stage
    const journeyData = {
      [AttendedTypeEnum.REGISTERED]: {
        count: 0,
        customers: [] as typeof attendees,
      },
      [AttendedTypeEnum.ATTENDED]: {
        count: 0,
        customers: [] as typeof attendees,
      },
      [AttendedTypeEnum.ADDED_TO_CART]: {
        count: 0,
        customers: [] as typeof attendees,
      },
      [AttendedTypeEnum.BREAKOUT_ROOM]: {
        count: 0,
        customers: [] as typeof attendees,
      },
      [AttendedTypeEnum.FOLLOW_UP]: {
        count: 0,
        customers: [] as typeof attendees,
      },
      [AttendedTypeEnum.CONVERTED]: {
        count: 0,
        customers: [] as typeof attendees,
      },
    }

    // Categorize customers by their most recent journey stage
    attendees.forEach((attendee) => {
      if (attendee.Attendance.length > 0) {
        const latestStage = attendee.Attendance[0].attendedType
        journeyData[latestStage].customers.push(attendee)
        journeyData[latestStage].count++
      }
    })

      // Calculate conversion metrics
      const totalCustomers = attendees.length
      const converted = journeyData[AttendedTypeEnum.CONVERTED].count
      const conversionRate =
        totalCustomers > 0 ? ((converted / totalCustomers) * 100).toFixed(1) : '0'

      return {
        status: 200,
        data: {
          journeyData,
          metrics: {
            totalCustomers,
            converted,
            conversionRate,
            activeInPipeline:
              totalCustomers -
              converted -
              journeyData[AttendedTypeEnum.REGISTERED].count,
          },
        },
      }
    })
  } catch (error) {
    console.error('Error getting customer journey:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export const getConvertedCustomers = async () => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const actorId = context.actorId
      if (!actorId) {
        return { status: 403, error: 'User not authorized' }
      }

      const currentUserRecord = await prisma.user.findUnique({
        where: {
          clerkId: actorId,
        },
        include: {
          tenantMemberships: {
            where: { tenantId: context.tenantId },
            select: { id: true },
          },
        },
      })

      if (!currentUserRecord) {
        return { status: 404, error: 'User not found' }
      }

      if (currentUserRecord.tenantMemberships.length === 0) {
        return { status: 403, error: 'User is not a member of this tenant' }
      }

      const convertedCustomers = await prisma.attendee.findMany({
        where: {
          Attendance: {
            some: {
              attendedType: AttendedTypeEnum.CONVERTED,
              webinar: {
                presenterId: currentUserRecord.id,
                tenantId: context.tenantId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          callStatus: true,
          createdAt: true,
          updatedAt: true,
          Attendance: {
          where: {
            attendedType: AttendedTypeEnum.CONVERTED,
            webinar: {
              presenterId: currentUserRecord.id,
              tenantId: context.tenantId,
            },
          },
          select: {
            joinedAt: true,
            webinarId: true,
            webinar: {
              select: {
                id: true,
                title: true,
                tags: true,
                startTime: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      })

      return {
        status: 200,
        customers: convertedCustomers,
      }
    })
  } catch (error) {
    console.error('Error getting converted customers:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export const getCustomerStats = async () => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const actorId = context.actorId
      if (!actorId) {
        return { status: 403, error: 'User not authorized' }
      }

      const currentUserRecord = await prisma.user.findUnique({
        where: {
          clerkId: actorId,
        },
        include: {
          tenantMemberships: {
            where: { tenantId: context.tenantId },
            select: { id: true },
          },
        },
      })

      if (!currentUserRecord) {
        return { status: 404, error: 'User not found' }
      }

      if (currentUserRecord.tenantMemberships.length === 0) {
        return { status: 403, error: 'User is not a member of this tenant' }
      }

      const [totalLeads, converted, inProgress, webinarCount] = await Promise.all([
        // Total leads/attendees
        prisma.attendee.count({
          where: {
            Attendance: {
              some: {
                webinar: {
                  presenterId: currentUserRecord.id,
                  tenantId: context.tenantId,
                },
              },
            },
          },
        }),
        // Converted customers
        prisma.attendee.count({
          where: {
            Attendance: {
              some: {
                attendedType: AttendedTypeEnum.CONVERTED,
                webinar: {
                  presenterId: currentUserRecord.id,
                  tenantId: context.tenantId,
                },
              },
            },
          },
        }),
        // In progress (not registered, not converted)
        prisma.attendee.count({
          where: {
            Attendance: {
              some: {
                attendedType: {
                  notIn: [AttendedTypeEnum.REGISTERED, AttendedTypeEnum.CONVERTED],
                },
                webinar: {
                  presenterId: currentUserRecord.id,
                  tenantId: context.tenantId,
                },
              },
            },
          },
        }),
        // Total webinars
        prisma.webinar.count({
          where: {
            presenterId: currentUserRecord.id,
            tenantId: context.tenantId,
          },
        }),
      ])

      const conversionRate =
        totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0'

      return {
        status: 200,
        stats: {
          totalLeads,
          converted,
          inProgress,
          conversionRate,
          webinarCount,
        },
      }
    })
  } catch (error) {
    console.error('Error getting customer stats:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}
