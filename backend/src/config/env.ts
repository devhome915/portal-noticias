import 'dotenv/config'
import { z } from 'zod'

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
} as const
