import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DIRECTORS_PER_PAGE = 20

// OPTIMIZATION: Cache ISR et Edge Runtime pour performance
export const revalidate = 60 // Cache ISR 60 secondes
export const runtime = 'edge' // Edge runtime pour latence minimale

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || DIRECTORS_PER_PAGE.toString())
    const search = searchParams.get('search')?.trim() || ''

    const supabase = await createClient()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with count
    let query = supabase
      .from('directors')
      .select(`
        *,
        movie_directors(id)
      `, { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('nom_complet', `%${search}%`)
    }

    // Order by nom (nom de famille) alphabetically
    query = query.order('nom', { ascending: true, nullsFirst: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: directors, error, count } = await query

    if (error) {
      console.error('Supabase error details:', error)
      console.error('Query parameters:', { page, limit, search })
      return NextResponse.json(
        { error: 'Failed to fetch directors', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to include movie_count
    const directorsWithCount = directors?.map(director => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const movieDirectors = (director as any).movie_directors
      return {
        ...director,
        movie_count: Array.isArray(movieDirectors) ? movieDirectors.length : 0
      }
    }) || []

    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages

    // Add cache headers for CDN
    const response = NextResponse.json({
      directors: directorsWithCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage: page > 1
      }
    })

    response.headers.set(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300'
    )

    return response

  } catch (error) {
    console.error('Unexpected error in directors API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
