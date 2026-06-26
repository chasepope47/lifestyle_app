import crypto from 'crypto'

// Sign/verify the WebAuthn challenge via HMAC so we don't need a DB table.
// Falls back to a hash of the public anon key if the service role key isn't set.
function getSecret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    crypto.createHash('sha256').update(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).digest('hex')
  )
}

export function signChallenge(challenge: string): string {
  const sig = crypto.createHmac('sha256', getSecret()).update(challenge).digest('base64url')
  return `${challenge}.${sig}`
}

// Returns the challenge string or null if the signature is invalid/missing.
export function verifyAndExtractChallenge(signed: string): string | null {
  const dot = signed.lastIndexOf('.')
  if (dot < 0) return null
  const challenge = signed.slice(0, dot)
  const sig = signed.slice(dot + 1)
  const expected = crypto.createHmac('sha256', getSecret()).update(challenge).digest('base64url')
  return sig === expected ? challenge : null
}

export const CHALLENGE_COOKIE = 'wa_ch'
export const CHALLENGE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 300, // 5 minutes
}
