-- AlterTable
ALTER TABLE "TenantProvisioningJob"
ADD COLUMN IF NOT EXISTS "targetSchema" VARCHAR(128);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TenantProvisioningEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ProvisioningStatus" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantProvisioningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TenantProvisioningEvent_tenantId_createdAt_idx"
  ON "TenantProvisioningEvent"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "TenantProvisioningEvent_jobId_idx"
  ON "TenantProvisioningEvent"("jobId");

-- AddForeignKey
ALTER TABLE "TenantProvisioningEvent"
ADD CONSTRAINT "TenantProvisioningEvent_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "TenantProvisioningJob"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantProvisioningEvent"
ADD CONSTRAINT "TenantProvisioningEvent_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

