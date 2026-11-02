import { scryptSync } from 'node:crypto'

const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex')
const passwordHash = scryptSync('test-only-password', salt, 64).toString('hex')

process.env.ADMIN_USERNAME = 'test-admin'
process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt.toString('hex')}$${passwordHash}`
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET = 'test-only-client-secret'
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/admin/google/auth/callback'
