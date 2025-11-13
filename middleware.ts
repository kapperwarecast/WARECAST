import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isUUID } from '@/lib/utils/slug'

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

  // Handle UUID → slug redirections for SEO-friendly URLs
  const pathname = request.nextUrl.pathname

  // Check for film routes with UUID
  const filmMatch = pathname.match(/^\/film\/([^\/]+)/)
  if (filmMatch && isUUID(filmMatch[1])) {
    const uuid = filmMatch[1]
    try {
      const { data: movie } = await supabase
        .from('movies')
        .select('slug')
        .eq('id', uuid)
        .single()

      if (movie?.slug) {
        const url = request.nextUrl.clone()
        url.pathname = `/film/${movie.slug}`
        return NextResponse.redirect(url, { status: 301 })
      }
    } catch (error) {
      console.error('Error redirecting film UUID:', error)
    }
  }

  // Check for movie-player routes with UUID
  const playerMatch = pathname.match(/^\/movie-player\/([^\/]+)/)
  if (playerMatch && isUUID(playerMatch[1])) {
    const uuid = playerMatch[1]
    try {
      const { data: movie } = await supabase
        .from('movies')
        .select('slug')
        .eq('id', uuid)
        .single()

      if (movie?.slug) {
        const url = request.nextUrl.clone()
        url.pathname = `/movie-player/${movie.slug}`
        return NextResponse.redirect(url, { status: 301 })
      }
    } catch (error) {
      console.error('Error redirecting movie-player UUID:', error)
    }
  }

  // Check for payment routes with UUID
  const paymentMatch = pathname.match(/^\/payment\/([^\/]+)/)
  if (paymentMatch && isUUID(paymentMatch[1])) {
    const uuid = paymentMatch[1]
    try {
      const { data: movie } = await supabase
        .from('movies')
        .select('slug')
        .eq('id', uuid)
        .single()

      if (movie?.slug) {
        const url = request.nextUrl.clone()
        url.pathname = `/payment/${movie.slug}`
        return NextResponse.redirect(url, { status: 301 })
      }
    } catch (error) {
      console.error('Error redirecting payment UUID:', error)
    }
  }

  // Check for personne routes with UUID (acteur or directeur)
  const personneMatch = pathname.match(/^\/personne\/(acteur|directeur)\/([^\/]+)/)
  if (personneMatch && isUUID(personneMatch[2])) {
    const type = personneMatch[1]
    const uuid = personneMatch[2]
    const table = type === 'acteur' ? 'actors' : 'directors'

    try {
      const { data: person } = await supabase
        .from(table)
        .select('slug')
        .eq('id', uuid)
        .single()

      if (person?.slug) {
        const url = request.nextUrl.clone()
        url.pathname = `/personne/${type}/${person.slug}`
        return NextResponse.redirect(url, { status: 301 })
      }
    } catch (error) {
      console.error(`Error redirecting ${type} UUID:`, error)
    }
  }

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Protect auth routes - redirect if already logged in
  // EXCEPT for password reset flow (confirm + reset-password)
  if (request.nextUrl.pathname.startsWith('/auth/') && user) {
    const isPasswordResetFlow =
      request.nextUrl.pathname === '/auth/reset-password' ||
      request.nextUrl.pathname === '/auth/confirm'

    if (!isPasswordResetFlow) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Protect app routes - redirect if not logged in
  const protectedPaths = [
    '/profile',
    '/formules',
    '/admin',
    '/settings',
    '/dashboard',
    '/films-en-cours'
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