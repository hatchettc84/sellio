import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

type EnvShape = z.infer<typeof envSchema>;

let cachedConfig: {
  env: EnvShape['NODE_ENV'];
  port: number;
  logLevel: EnvShape['LOG_LEVEL'];
} | null = null;

export function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.parse(process.env);

  cachedConfig = {
    env: parsed.NODE_ENV,
    port: parsed.PORT ? Number(parsed.PORT) : 4000,
    logLevel: parsed.LOG_LEVEL,
  };

  return cachedConfig;
}
