import { posterImportService } from '@/lib/services/poster-import'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🎬 API: Démarrage de l\'import des affiches personnalisées')
    
    const result = await posterImportService.importCustomPosters()
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Import des affiches échoué' },
        { status: 500 }
      )
    }

    console.log(`🎬 API: Import terminé - ${result.totalUploaded} affiches uploadées, ${result.totalUpdated} films mis à jour`)
    
    return NextResponse.json({
      success: true,
      message: `Import terminé avec succès`,
      totalFound: result.totalFound,
      totalUploaded: result.totalUploaded,
      totalUpdated: result.totalUpdated,
      results: result.results
    })

  } catch (error) {
    console.error('🎬 API: Erreur import affiches:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'import des affiches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}