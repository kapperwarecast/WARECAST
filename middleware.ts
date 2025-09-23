import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Protect auth routes - redirect if already logged in
  if (request.nextUrl.pathname.startsWith('/auth/') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Protect app routes - redirect if not logged in
  const protectedPaths = [
    '/profile',
    '/abonnement',
    '/admin',
    '/settings',
    '/dashboard'
  ]

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Préserver les paramètres de query de la route originale
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search
    url.searchParams.set('redirect', returnUrl)
    return NextResponse.redirect(url)
  }

  // Routes publiques qui ne doivent pas être accessibles aux utilisateurs connectés
  const publicOnlyPaths = ['/auth/login', '/auth/signup']
  if (publicOnlyPaths.some(path => request.nextUrl.pathname === path) && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    url.search = '' // Nettoyer les paramètres de recherche
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}