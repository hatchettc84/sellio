import type { Application, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

const datasetUploadSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(2048).optional(),
  source: z.string().max(256).optional(),
});

export function registerIngestionRoutes(app: Application) {
  const router = Router();

  router.post('/datasets', (req: Request, res: Response) => {
    const parseResult = datasetUploadSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_DATASET_PAYLOAD',
        issues: parseResult.error.format(),
      });
    }

    const datasetId = `ds_${Math.random().toString(36).slice(2, 10)}`;

    return res.status(202).json({
      datasetId,
      tenantId: req.tenant?.id,
      status: 'QUEUED',
      receivedAt: new Date().toISOString(),
    });
  });

  router.post('/datasets/:datasetId/train', (req: Request, res: Response) => {
    const { datasetId } = req.params;

    return res.status(202).json({
      datasetId,
      tenantId: req.tenant?.id,
      workflow: 'TRAINING_REQUESTED',
      triggeredAt: new Date().toISOString(),
    });
  });

  router.delete('/datasets/:datasetId', (req: Request, res: Response) => {
    const { datasetId } = req.params;

    return res.status(202).json({
      datasetId,
      tenantId: req.tenant?.id,
      status: 'DELETION_REQUESTED',
      requestedAt: new Date().toISOString(),
    });
  });

  app.use('/v1/ingestion', router);
}
