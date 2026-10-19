import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/backend') ||
    pathname === '/stackicon.png' ||
    pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  // Accept either a real Keycloak token (from SSO) or a dev bypass cookie
  const keycloakToken = request.cookies.get('access_token')?.value
  const devAuth = request.cookies.get('dev_auth')?.value

  if (!keycloakToken && !devAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
