import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()
  const origin = new URL(request.url).origin
  const rpID = new URL(request.url).hostname

  // Retrieve and validate the challenge
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('challenge, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }

  const { credential } = verification.registrationInfo
  const deviceName = body.deviceName ?? 'Unknown device'

  // Store the credential
  const { error } = await admin.from('webauthn_credentials').insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString('base64'),
    counter: credential.counter,
    transports: credential.transports ? JSON.stringify(credential.transports) : null,
    backed_up: verification.registrationInfo.credentialBackedUp,
    device_name: deviceName,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clean up the used challenge
  await admin.from('webauthn_challenges').delete().eq('user_id', user.id)

  return NextResponse.json({ verified: true })
}
