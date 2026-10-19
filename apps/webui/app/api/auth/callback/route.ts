import { NextRequest, NextResponse } from 'next/server'
import { apiConfig } from '@/lib/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Derive origin from the actual request so it works regardless of whether
  // the user is accessing via localhost, machine IP, or any other hostname.
  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=${error ?? 'no_code'}`)
  }

  const redirectUri = `${origin}/api/auth/callback`

  try {
    const res = await fetch(`${apiConfig.backendUrl}/api/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })

    if (!res.ok) {
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`)
    }

    const tokens = await res.json()
    const response = NextResponse.redirect(`${origin}/dashboard`)

    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: tokens.expires_in ?? 300,
      path: '/',
    })

    if (tokens.refresh_token) {
      response.cookies.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
    }

    return response
  } catch {
    return NextResponse.redirect(`${origin}/login?error=server_error`)
  }
}
