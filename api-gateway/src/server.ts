import 'dotenv/config';
import { createApp } from './app.js';
import { getConfig } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const config = getConfig();

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'API gateway listening');
});
