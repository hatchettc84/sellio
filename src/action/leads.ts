'use server'

import { runTenantOperation } from '@/lib/tenant/auth'

export const getLeads = async () => {
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

      const leads = await prisma.attendee.findMany({
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
              webinar: {
                select: {
                  tags: true,
                },
              },
            },
          },
        },
      })

      const transformedLeads = leads.map((lead: { name: string | null; email: string; Attendance: Array<{ webinar: { tags: string[] } }> }) => ({
        name: lead.name,
        email: lead.email,
        phone: '',
        tags: lead.Attendance.flatMap((attendance: { webinar: { tags: string[] } }) => attendance.webinar.tags),
      }))

      return {
        status: 200,
        leads: transformedLeads,
      }
    })
  } catch (error) {
    console.log('🔴 ERROR', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}
