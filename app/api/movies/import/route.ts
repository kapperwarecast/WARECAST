import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { movieImportService } from '@/lib/tmdb/services'
import type { MovieImportRequest, MovieImportResult } from '@/lib/tmdb/types'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: MovieImportRequest = await request.json()
    const { tmdbIds } = body

    if (!tmdbIds || !Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      return NextResponse.json(
        { error: 'tmdbIds array is required' },
        { status: 400 }
      )
    }

    // Validate TMDB IDs
    const validIds = tmdbIds.filter(id => Number.isInteger(id) && id > 0)
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid TMDB IDs provided' },
        { status: 400 }
      )
    }

    console.log(`Starting import for ${validIds.length} movies:`, validIds)

    // Import movies sequentially to respect rate limits
    const results: MovieImportResult[] = []
    
    for (const tmdbId of validIds) {
      console.log(`Processing TMDB ID: ${tmdbId}`)
      const result = await movieImportService.importMovie(tmdbId)
      results.push(result)
      
      // Log progress
      const completed = results.length
      const total = validIds.length
      const success = results.filter(r => r.success).length
      console.log(`Progress: ${completed}/${total} (${success} successful)`)
    }

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`Import completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed
      },
      results
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}