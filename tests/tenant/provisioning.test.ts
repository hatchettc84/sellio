import { describe, expect, it, vi } from 'vitest'
import type { Prisma, ProvisioningTrigger } from '@prisma/client'
import { scheduleProvisioningJob, updateProvisioningJobStatus } from '@/lib/tenant/provisioning'
import { withTenantContext } from '@/lib/tenant/context'

type CreateArgs = Prisma.TenantProvisioningJobCreateArgs
type UpdateArgs = Prisma.TenantProvisioningJobUpdateArgs

function createPrismaMock() {
  return {
    tenantProvisioningJob: {
      create: vi.fn<Parameters<CreateArgsFunction>, ReturnType<CreateArgsFunction>>(
        async (args) => args,
      ),
      update: vi.fn<Parameters<UpdateArgsFunction>, ReturnType<UpdateArgsFunction>>(
        async (args) => args,
      ),
    },
  }
}

type CreateArgsFunction = (args: CreateArgs) => Promise<CreateArgs>
type UpdateArgsFunction = (args: UpdateArgs) => Promise<UpdateArgs>

describe('tenant provisioning automation', () => {
  it('schedules provisioning job with tenant context applied', async () => {
    const prisma = createPrismaMock()

    const trigger: ProvisioningTrigger = 'SUBSCRIPTION_ACTIVATED'
    const metadata = { plan: 'growth', region: 'us-east' }

    const result = await scheduleProvisioningJob({
      prisma,
      tenantId: 'tenant-123',
      trigger,
      metadata,
      actorId: 'user-99',
    })

    expect(prisma.tenantProvisioningJob.create).toHaveBeenCalledTimes(1)
    expect(result?.data?.tenantId).toBe('tenant-123')
    expect(result?.data?.trigger).toBe(trigger)
    expect(result?.data?.metadata).toMatchObject(metadata as Prisma.JsonObject)
    expect(result?.data?.startedAt).toBeInstanceOf(Date)
  })

  it('updates provisioning job status and timestamps securely', async () => {
    const prisma = createPrismaMock()

    const result = await withTenantContext({ tenantId: 'tenant-123', actorId: 'system' }, async () =>
      updateProvisioningJobStatus({
        prisma,
        jobId: 'job-456',
        tenantId: 'tenant-123',
        status: 'COMPLETED',
      }),
    )

    expect(prisma.tenantProvisioningJob.update).toHaveBeenCalledTimes(1)
    expect(result?.where).toEqual({ id: 'job-456' })
    expect(result?.data?.status).toBe('COMPLETED')
    expect(result?.data?.completedAt).toBeInstanceOf(Date)
  })
})

