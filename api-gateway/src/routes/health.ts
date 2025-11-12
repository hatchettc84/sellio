import type { Application, Request, Response } from 'express';

export function registerHealthRoutes(app: Application) {
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/system/ping', (_req: Request, res: Response) => {
    res.json({ message: 'pong' });
  });
}
