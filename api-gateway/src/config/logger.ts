import pino from 'pino';
import { getConfig } from './env.js';

const config = getConfig();

export const logger = pino({
  name: 'spotlight-api-gateway',
  level: config.logLevel,
  transport: config.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});
