import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MOVIES_PER_PAGE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || MOVIES_PER_PAGE.toString())
    
    const supabase = await createClient()
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Get movies with pagination
    const { data: movies, error, count } = await supabase
      .from('movies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching movies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch movies' },
        { status: 500 }
      )
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    
    return NextResponse.json({
      movies: movies || [],
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