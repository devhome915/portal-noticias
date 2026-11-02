import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotEnv } from 'dotenv'
import { z } from 'zod'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const backendEnvPath = [
  resolve(moduleDirectory, '../../.env'),
  resolve(moduleDirectory, '../../../.env'),
].find(existsSync)

if (backendEnvPath) loadDotEnv({ path: backendEnvPath })
else loadDotEnv()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_USERNAME: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().min(3).optional(),
  ),
  ADMIN_PASSWORD_HASH: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().regex(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/i).optional(),
  ),
  ADMIN_GOOGLE_EMAIL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  GOOGLE_CLIENT_ID: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3001/api/admin/google/auth/callback'),
  GOOGLE_SHEETS_ID: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
  GOOGLE_DRIVE_FOLDER_ID: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const invalidVariables = parsedEnv.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Configuração de ambiente inválida: ${invalidVariables}`)
}

export const env = {
  port: parsedEnv.data.PORT,
  nodeEnv: parsedEnv.data.NODE_ENV,
  frontendUrl: parsedEnv.data.FRONTEND_URL,
  adminUsername: parsedEnv.data.ADMIN_USERNAME,
  adminPasswordHash: parsedEnv.data.ADMIN_PASSWORD_HASH,
  adminGoogleEmail: parsedEnv.data.ADMIN_GOOGLE_EMAIL?.toLowerCase(),
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: parsedEnv.data.GOOGLE_REDIRECT_URI,
  googleSheetsId: parsedEnv.data.GOOGLE_SHEETS_ID,
  googleDriveFolderId: parsedEnv.data.GOOGLE_DRIVE_FOLDER_ID,
} as const
