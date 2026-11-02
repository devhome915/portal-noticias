import { randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { env } from '../config/env.js'

const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOCATION_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'
const STATE_TTL_MS = 10 * 60 * 1000
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
]

type PendingAuthorization = {
  adminToken: string
  expiresAt: number
}

type GoogleTokens = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope: string
}

const googleTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  scope: z.string(),
  token_type: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
})

const pendingAuthorizations = new Map<string, PendingAuthorization>()
const googleTokensByAdmin = new Map<string, GoogleTokens>()
const pendingLoginAuthorizations = new Map<string, { expiresAt: number; returnTo: string }>()

export function isGoogleOAuthConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri)
}

function getOAuthCredentials() {
  if (!isGoogleOAuthConfigured() || !env.googleClientId || !env.googleClientSecret) {
    throw new Error('A integração Google não está configurada no backend.')
  }

  return {
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: env.googleRedirectUri,
  }
}

export function createGoogleAuthorizationUrl(adminToken: string) {
  const credentials = getOAuthCredentials()
  const now = Date.now()

  for (const [state, pending] of pendingAuthorizations) {
    if (pending.expiresAt <= now) {
      pendingAuthorizations.delete(state)
    }
  }

  const state = randomBytes(32).toString('hex')
  pendingAuthorizations.set(state, {
    adminToken,
    expiresAt: now + STATE_TTL_MS,
  })

  const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT)
  authorizationUrl.search = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  }).toString()

  return authorizationUrl.toString()
}

function createAuthorizationUrl(scopes: string[], state: string) {
  const credentials = getOAuthCredentials()
  const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT)
  authorizationUrl.search = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'online',
    include_granted_scopes: 'true',
    state,
  }).toString()
  return authorizationUrl.toString()
}

function getSafeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}

export function createGoogleLoginUrl(returnTo?: string) {
  const now = Date.now()
  for (const [state, pending] of pendingLoginAuthorizations) {
    if (pending.expiresAt <= now) pendingLoginAuthorizations.delete(state)
  }
  const state = randomBytes(32).toString('hex')
  pendingLoginAuthorizations.set(state, { expiresAt: now + STATE_TTL_MS, returnTo: getSafeReturnTo(returnTo) })
  return createAuthorizationUrl(['openid', 'email', 'profile'], state)
}

export function isPendingGoogleLogin(state: string) {
  const pending = pendingLoginAuthorizations.get(state)
  return Boolean(pending && pending.expiresAt > Date.now())
}

export function cancelGoogleLogin(state: string) {
  return pendingLoginAuthorizations.delete(state)
}

export async function completeGoogleLogin(code: string, state: string) {
  const pending = pendingLoginAuthorizations.get(state)
  pendingLoginAuthorizations.delete(state)
  if (!pending || pending.expiresAt <= Date.now()) {
    throw new Error('A tentativa de login Google expirou. Tente novamente.')
  }

  const credentials = getOAuthCredentials()
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = parseTokenResponse(await tokenResponse.text())
  if (!tokenResponse.ok) throw new Error('O Google recusou a autenticação.')

  const profileResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (!profileResponse.ok) throw new Error('Não foi possível confirmar a conta Google.')
  const profile = z.object({
    email: z.string().email(),
    email_verified: z.boolean(),
    name: z.string().optional(),
    picture: z.string().url().optional(),
  }).safeParse(await profileResponse.json())
  if (!profile.success || !profile.data.email_verified) {
    throw new Error('O Google não confirmou o endereço de e-mail desta conta.')
  }
  return {
    email: profile.data.email.toLowerCase(),
    name: profile.data.name,
    picture: profile.data.picture,
    returnTo: pending.returnTo,
  }
}

function consumeAuthorizationState(state: string, adminToken: string) {
  const pending = pendingAuthorizations.get(state)
  pendingAuthorizations.delete(state)

  if (!pending || pending.expiresAt <= Date.now()) {
    return false
  }

  const suppliedAdminToken = Buffer.from(adminToken)
  const expectedAdminToken = Buffer.from(pending.adminToken)
  const tokenMatches =
    suppliedAdminToken.length === expectedAdminToken.length &&
    timingSafeEqual(suppliedAdminToken, expectedAdminToken)

  return tokenMatches
}

export function cancelGoogleAuthorization(state: string, adminToken: string) {
  return consumeAuthorizationState(state, adminToken)
}

function parseTokenResponse(payload: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(payload)
  } catch {
    throw new Error('O Google retornou uma resposta OAuth inválida.')
  }

  const result = googleTokenResponseSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('O Google retornou uma resposta OAuth incompleta.')
  }

  return result.data
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  state: string,
  adminToken: string,
) {
  if (!consumeAuthorizationState(state, adminToken)) {
    throw new Error('A autorização Google expirou ou não corresponde à sessão atual. Tente novamente.')
  }

  const credentials = getOAuthCredentials()
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const payload = await response.text()
  if (!response.ok) {
    throw new Error(`O Google recusou a troca do código OAuth (HTTP ${response.status}).`)
  }

  const tokens = parseTokenResponse(payload)
  googleTokensByAdmin.set(adminToken, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
  })
}

export function getGoogleConnectionStatus(adminToken: string) {
  const tokens = googleTokensByAdmin.get(adminToken)
  return {
    configured: isGoogleOAuthConfigured(),
    connected: Boolean(tokens),
    scopes: tokens?.scope.split(' ') ?? [],
    accessTokenExpiresAt: tokens?.expiresAt ?? null,
    persistence: 'memory',
  }
}

export function forgetGoogleConnection(adminToken: string) {
  googleTokensByAdmin.delete(adminToken)
}

export async function disconnectGoogleAccount(adminToken: string) {
  const tokens = googleTokensByAdmin.get(adminToken)
  if (!tokens) {
    return
  }

  const tokenToRevoke = tokens.refreshToken ?? tokens.accessToken
  const response = await fetch(GOOGLE_REVOCATION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: tokenToRevoke }),
  })

  if (!response.ok) {
    throw new Error(`Não foi possível revogar o acesso Google (HTTP ${response.status}).`)
  }

  googleTokensByAdmin.delete(adminToken)
}
