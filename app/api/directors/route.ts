import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DIRECTORS_PER_PAGE = 20

// OPTIMIZATION: Cache ISR et Edge Runtime pour performance
export const revalidate = 60 // Cache ISR 60 secondes
export const runtime = 'edge' // Edge runtime pour latence minimale

// Helper function to parse decade into year range
function getDecadeRange(decade: string): { start: number; end: number } | null {
  const match = decade.match(/^(\d{4})s$/)
  if (!match) return null
  const start = parseInt(match[1])
  return { start, end: start + 9 }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || DIRECTORS_PER_PAGE.toString())
    const search = searchParams.get('search')?.trim() || ''
    const decade = searchParams.get('decade')?.trim() || ''
    const language = searchParams.get('language')?.trim() || ''
    const preview = searchParams.get('preview') === 'true'

    const supabase = await createClient()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Step 1: Filter directors by decade/language using RPC function
    let filteredDirectorIds: string[] | null = null

    if (decade || language) {
      const range = decade ? getDecadeRange(decade) : null

      const { data: directorIds, error: filterError } = await supabase.rpc(
        'filter_directors_by_movies',
        {
          p_decade_start: range?.start ?? null,
          p_decade_end: range?.end ?? null,
          p_language: language || null
        }
      )

      if (filterError) {
        console.error('Error filtering directors:', filterError)
        // Continue without filter rather than failing
      } else if (directorIds) {
        // Extract director IDs from RPC result
        filteredDirectorIds = directorIds.map((row: { director_id: string }) => row.director_id)
      }
    }

    // Step 2: Build main query with all filters
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

    // Apply filtered director IDs if we have them
    if (filteredDirectorIds !== null) {
      if (filteredDirectorIds.length === 0) {
        // No directors match the filters, return empty result
        const emptyResponse = preview
          ? { count: 0 }
          : {
              directors: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
        return NextResponse.json(emptyResponse)
      }
      query = query.in('id', filteredDirectorIds)
    }

    // Order by nom (nom de famille) alphabetically
    query = query.order('nom', { ascending: true, nullsFirst: false })

    // If preview mode, return count only
    if (preview) {
      const { count, error } = await query
      if (error) {
        console.error('Supabase error in preview mode:', error)
        return NextResponse.json({ count: 0 })
      }
      return NextResponse.json({ count: count || 0 })
    }

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
