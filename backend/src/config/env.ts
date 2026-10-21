import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env located in the backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1024).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, { message: 'MONGODB_URI is required' }),
  DB_NAME: z.string().min(1).default('stop-watch'),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters long' }),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
});


export type EnvConfig = z.infer<typeof envSchema>;

function loadAndValidateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.issues.forEach((issue) => {
      // Print field names and messages, never any secret values
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('Please configure your backend/.env file according to .env.example.');
    process.exit(1);
  }

  return result.data;
}

export const env = loadAndValidateEnv();
