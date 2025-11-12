import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { tenantContext } from './middleware/tenant-context.js';
import { registerIngestionRoutes } from './routes/ingestion.js';
import { registerMarketplaceRoutes } from './routes/marketplace.js';
import { registerTenantRoutes } from './routes/tenant.js';
import { registerConnectorRoutes } from './routes/connectors.js';
import { registerHealthRoutes } from './routes/health.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(bodyParser.json({ limit: '25mb' }));

  registerHealthRoutes(app);

  app.use(tenantContext());

  registerIngestionRoutes(app);
  registerMarketplaceRoutes(app);
  registerTenantRoutes(app);
  registerConnectorRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
