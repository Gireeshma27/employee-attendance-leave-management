import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * @description Centralized environment configuration and validation.
 * @module config/env
 */

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_USER: z.string().email(),
  EMAIL_PASSWORD: z.string(),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(_env.error.format(), null, 2),
  );
  process.exit(1);
}

const env = _env.data;

export default env;
