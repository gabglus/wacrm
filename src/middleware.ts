import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Run the i18n routing middleware first
  const response = handleI18nRouting(request)
  
  // If the i18n middleware returned a redirect (e.g. from / to /en or /es), return it immediately
  if (response.headers.has('location')) {
    return response
  }

  const supabaseResponse = response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const withRefreshedCookies = <T extends NextResponse>(res: T): T => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie)
    })
    return res
  }

  // Parse path for locale routing checks
  const pathname = request.nextUrl.pathname
  const hasLocalePrefix = /^\/(en|es)(\/|$)/.test(pathname)
  const strippedPathname = hasLocalePrefix ? pathname.replace(/^\/(en|es)/, '') : pathname
  const checkPath = strippedPathname || '/'
  const locale = hasLocalePrefix ? pathname.split('/')[1] : 'en'

  // Auth pages - redirect to dashboard if already logged in.
  if (user && (
    checkPath === '/login' ||
    checkPath === '/signup' ||
    checkPath === '/forgot-password'
  )) {
    const url = request.nextUrl.clone()
    const inviteToken = request.nextUrl.searchParams.get('invite')
    if (
      inviteToken &&
      (checkPath === '/login' || checkPath === '/signup')
    ) {
      url.pathname = `/${locale}/join/${encodeURIComponent(inviteToken)}`
      url.search = ''
    } else {
      url.pathname = `/${locale}/dashboard`
      url.search = ''
    }
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // Protected pages - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings']
  if (!user && protectedPaths.some(path => checkPath.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // API routes that need auth (not webhooks)
  if (!user && checkPath.startsWith('/api/whatsapp/') &&
      !checkPath.includes('/webhook')) {
    return withRefreshedCookies(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

