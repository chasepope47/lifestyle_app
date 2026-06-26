import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch existing credentials to exclude them (prevents duplicate registration)
  const { data: existing } = await admin
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id)

  const rpID = new URL(request.url).hostname

  const options = await generateRegistrationOptions({
    rpName: 'Together',
    rpID,
    userName: user.email!,
    userDisplayName: user.email!,
    attestationType: 'none',
    excludeCredentials: (existing ?? []).map(c => ({
      id: c.credential_id,
      transports: c.transports ? JSON.parse(c.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  // Clean up expired challenges, then store this one
  await admin.from('webauthn_challenges').delete().lt('expires_at', new Date().toISOString())
  await admin.from('webauthn_challenges').insert({
    user_id: user.id,
    challenge: options.challenge,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  })

  return NextResponse.json(options)
}
