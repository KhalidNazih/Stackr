import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Read Keycloak URL dynamically from process.env on the server at runtime.
  // Next.js static builds will leave process.env alone in API routes (since it runs in node at runtime).
  const rawUrl = process.env.KEYCLOAK_URL || process.env.NEXT_PUBLIC_KEYCLOAK_URL
  if (!rawUrl) {
    throw new Error('KEYCLOAK_URL (or NEXT_PUBLIC_KEYCLOAK_URL) environment variable is missing at runtime.')
  }
  const url = rawUrl.replace(/\/+$/, '')
  
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Devsecops_Platform_Users'
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'stackr-plus'
  
  const loginUrl = `${url}/realms/${realm}/protocol/openid-connect/auth`
  
  // Construct the redirect back to the client
  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const redirectUri = `${origin}/api/auth/callback`
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  })
  
  return NextResponse.redirect(`${loginUrl}?${params.toString()}`)
}
