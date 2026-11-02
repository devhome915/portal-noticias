import { scryptSync } from 'node:crypto'

const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex')
const passwordHash = scryptSync('test-only-password', salt, 64).toString('hex')

process.env.ADMIN_USERNAME = 'test-admin'
process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt.toString('hex')}$${passwordHash}`
process.env.FRONTEND_URL = 'http://localhost:5173'
