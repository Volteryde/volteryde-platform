import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Environment Schema - Single source of truth for all environment variables
 * Used by all services, apps, and workers in the monorepo
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database - PostgreSQL
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432'),
  DATABASE_NAME: z.string().default('volteryde'),
  DATABASE_USERNAME: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_URL: z.string().optional(),
  
  // Redis Cache
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().optional(),
  
  // Temporal Workflow Engine
  TEMPORAL_ADDRESS: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  
  // Authentication & Security
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_ISSUER_URI: z.string().default('http://localhost:8080'),
  JWT_EXPIRATION: z.string().default('86400'), // 24 hours in seconds
  
  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // External Services
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Documentation
  DOCS_URL: z.string().default('http://localhost:3002'),
  
  // Feature Flags
  ENABLE_TEMPORAL_WORKFLOWS: z.string().default('true'),
  ENABLE_REDIS_CACHE: z.string().default('true'),
  ENABLE_METRICS: z.string().default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return result.data;
}

/**
 * Global environment configuration
 * Import this in all services to access validated environment variables
 */
export const env = parseEnv();

/**
 * Helper to get database connection URL
 */
export function getDatabaseUrl(): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  
  return `postgresql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`;
}

/**
 * Helper to get Redis connection URL
 */
export function getRedisUrl(): string {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }
  
  const auth = env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : '';
  return `redis://${auth}${env.REDIS_HOST}:${env.REDIS_PORT}`;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Get CORS origins as array
 */
export function getCorsOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
}

/**
 * Feature flag helpers
 */
export const featureFlags = {
  isTemporalEnabled: () => env.ENABLE_TEMPORAL_WORKFLOWS === 'true',
  isRedisCacheEnabled: () => env.ENABLE_REDIS_CACHE === 'true',
  isMetricsEnabled: () => env.ENABLE_METRICS === 'true',
};
