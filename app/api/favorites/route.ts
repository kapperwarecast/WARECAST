import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MOVIES_PER_PAGE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || MOVIES_PER_PAGE.toString())

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Query to get favorite movies with movie details and directors
    const { data: favorites, error, count } = await supabase
      .from('likes')
      .select(`
        created_at,
        movies (
          *,
          movie_directors(
            directors(
              nom_complet
            )
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch favorite movies', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected movie format
    const movies = favorites?.map(favorite => favorite.movies).filter(movie => movie !== null) || []

    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages

    return NextResponse.json({
      movies,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}