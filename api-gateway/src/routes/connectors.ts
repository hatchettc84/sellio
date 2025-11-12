import type { Application, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

const connectorConfigSchema = z.record(z.unknown());
const connectorCredentialsSchema = z.record(z.unknown()).nullable();

const createConnectorSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['AZURE', 'GOOGLE', 'CRM', 'PRODUCT_CATALOG', 'CUSTOM']),
  config: connectorConfigSchema,
  credentials: connectorCredentialsSchema.optional(),
});

const updateConnectorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: connectorConfigSchema.optional(),
  credentials: connectorCredentialsSchema.optional(),
  autoSync: z.boolean().optional(),
  syncInterval: z.number().int().positive().optional(),
});

export function registerConnectorRoutes(app: Application) {
  const router = Router();

  // Get all connectors for tenant
  router.get('/connectors', (req: Request, res: Response) => {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }

    // In real implementation, call the server action
    return res.status(200).json({
      connectors: [],
      tenantId,
    });
  });

  // Get single connector
  router.get('/connectors/:connectorId', (req: Request, res: Response) => {
    const { connectorId } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }

    return res.status(200).json({
      connectorId,
      tenantId,
    });
  });

  // Create connector
  router.post('/connectors', (req: Request, res: Response) => {
    const parseResult = createConnectorSchema.safeParse(req.body);
    const tenantId = req.tenant?.id;
    const userId = req.user?.id; // Assuming user is attached by auth middleware

    if (!tenantId || !userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant and user context required',
      });
    }

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_CONNECTOR_PAYLOAD',
        issues: parseResult.error.format(),
      });
    }

    const connectorId = `conn_${Math.random().toString(36).slice(2, 10)}`;

    return res.status(201).json({
      connectorId,
      tenantId,
      status: 'CREATED',
      receivedAt: new Date().toISOString(),
    });
  });

  // Update connector
  router.patch('/connectors/:connectorId', (req: Request, res: Response) => {
    const { connectorId } = req.params;
    const parseResult = updateConnectorSchema.safeParse(req.body);
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_UPDATE_PAYLOAD',
        issues: parseResult.error.format(),
      });
    }

    return res.status(200).json({
      connectorId,
      tenantId,
      status: 'UPDATED',
      updatedAt: new Date().toISOString(),
    });
  });

  // Test connector
  router.post('/connectors/:connectorId/test', (req: Request, res: Response) => {
    const { connectorId } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }

    return res.status(202).json({
      connectorId,
      tenantId,
      testStatus: 'PENDING',
      triggeredAt: new Date().toISOString(),
    });
  });

  // Sync connector
  router.post('/connectors/:connectorId/sync', (req: Request, res: Response) => {
    const { connectorId } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant and user context required',
      });
    }

    return res.status(202).json({
      connectorId,
      tenantId,
      syncStatus: 'QUEUED',
      triggeredAt: new Date().toISOString(),
    });
  });

  // Delete connector
  router.delete('/connectors/:connectorId', (req: Request, res: Response) => {
    const { connectorId } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }

    return res.status(202).json({
      connectorId,
      tenantId,
      status: 'DELETION_REQUESTED',
      requestedAt: new Date().toISOString(),
    });
  });

  app.use('/v1/tenants', router);
}

