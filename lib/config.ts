/**
 * Environment Configuration for Tourism Explorer
 * Uses Zod for runtime validation of environment variables
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  TOURAPI_KEY: z.string().min(1, 'TourAPI key is required'),
  TOURAPI_BASE_URL: z
    .string()
    .url()
    .default('https://apis.data.go.kr/B551011/KorService2'),
  NAVER_MAP_CLIENT_ID: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Parse and validate environment variables
// In test environment, provide defaults to prevent validation errors
export const env = envSchema.parse({
  TOURAPI_KEY: process.env.TOURAPI_KEY || (process.env.NODE_ENV === 'test' ? 'test_key' : undefined),
  TOURAPI_BASE_URL: process.env.TOURAPI_BASE_URL,
  NAVER_MAP_CLIENT_ID: process.env.NAVER_MAP_CLIENT_ID,
  NODE_ENV: process.env.NODE_ENV,
});

// Application configuration object
export const config = {
  tourApi: {
    key: env.TOURAPI_KEY,
    baseUrl: env.TOURAPI_BASE_URL,
  },
  naverMap: {
    clientId: env.NAVER_MAP_CLIENT_ID,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const;
