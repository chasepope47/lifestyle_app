import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { signChallenge, CHALLENGE_COOKIE, CHALLENGE_COOKIE_OPTIONS } from '@/lib/webauthn/challenge'
import { getRpID } from '@/lib/webauthn/rp'

export async function POST() {
  const rpID = getRpID()

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    // No allowCredentials = discoverable credential flow (browser picks the right passkey)
  })

  const signed = signChallenge(options.challenge)
  const res = NextResponse.json(options)
  res.cookies.set(CHALLENGE_COOKIE, signed, CHALLENGE_COOKIE_OPTIONS)
  return res
}
