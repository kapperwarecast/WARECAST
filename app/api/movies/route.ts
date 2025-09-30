import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MOVIES_PER_PAGE = 20

// Configuration du cache pour accélérer les requêtes
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalider toutes les 60 secondes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || MOVIES_PER_PAGE.toString())
    
    // Filter parameters
    const genres = searchParams.get('genres')?.split(',').filter(g => g.trim()) || []
    const decade = searchParams.get('decade')
    const language = searchParams.get('language')
    
    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const randomSeed = searchParams.get('randomSeed') || ''
    
    // Preview mode (count only)
    const preview = searchParams.get('preview') === 'true'
    
    const supabase = await createClient()
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query with filters and join with directors
    let query = supabase
      .from('movies')
      .select(preview ? '*' : `
        *,
        movie_directors(
          directors(
            nom_complet
          )
        )
      `, { count: 'exact' })

    // Filter by status - only show "en ligne" movies
    query = query.eq('statut', 'en ligne')

    // Apply filters
    if (genres.length > 0) {
      // Assuming genres is stored as an array or comma-separated string
      query = query.overlaps('genres', genres)
    }
    
    if (decade) {
      // Convert decade to year range (e.g., "2020s" -> 2020-2029)
      const decadeStart = parseInt(decade.replace('s', ''))
      const decadeEnd = decadeStart + 9
      query = query.gte('annee_sortie', decadeStart).lte('annee_sortie', decadeEnd)
    }
    
    if (language) {
      query = query.eq('langue_vo', language)
    }
    
    // For preview mode, we only need the count
    if (preview) {
      const { count, error } = await query
      
      if (error) {
        console.error('Supabase error details:', error)
        console.error('Query parameters:', { genres, decade, language, preview })
        return NextResponse.json(
          { error: 'Failed to fetch movies count', details: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        count: count || 0
      })
    }
    
    // Apply sorting with fallback for full query
    const ascending = sortOrder === 'asc'

    // Ensure we have a valid sort field (using real Supabase column names)
    const validSortFields = ['annee_sortie', 'created_at', 'titre_francais', 'note_tmdb', 'random']
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'

    // For random sort, use seed to determine pseudo-random order
    if (safeSortBy === 'random' && randomSeed) {
      // Générer un hash simple du seed pour déterminer la stratégie de tri
      const seedHash = randomSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const strategy = seedHash % 6

      // Différentes stratégies de tri pour créer de la variété
      switch (strategy) {
        case 0:
          query = query.order('tmdb_id', { ascending: true })
          break
        case 1:
          query = query.order('tmdb_id', { ascending: false })
          break
        case 2:
          query = query.order('annee_sortie', { ascending: true }).order('tmdb_id', { ascending: true })
          break
        case 3:
          query = query.order('annee_sortie', { ascending: false }).order('tmdb_id', { ascending: false })
          break
        case 4:
          query = query.order('note_tmdb', { ascending: false, nullsFirst: false }).order('tmdb_id', { ascending: true })
          break
        case 5:
          query = query.order('duree', { ascending: true, nullsFirst: false }).order('tmdb_id', { ascending: false })
          break
      }
    } else if (safeSortBy === 'random') {
      // Fallback si pas de seed
      query = query.order('tmdb_id', { ascending: true })
    } else {
      query = query.order(safeSortBy, { ascending })
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: movies, error, count } = await query
    
    if (error) {
      console.error('Supabase error details:', error)
      console.error('Query parameters:', { genres, decade, language, sortBy: safeSortBy, sortOrder })
      return NextResponse.json(
        { error: 'Failed to fetch movies', details: error.message },
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