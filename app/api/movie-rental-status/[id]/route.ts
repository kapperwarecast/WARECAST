import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur a ce film en cours de location
    const { data: rental, error: rentalError } = await supabase
      .from('emprunts')
      .select('id, statut, date_retour')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .eq('statut', 'en_cours')
      .gt('date_retour', new Date().toISOString()) // Vérifier que la location n'est pas expirée
      .single()

    if (rentalError && rentalError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est normal si pas de location
      console.error('Error checking movie rental status:', rentalError)
      return NextResponse.json(
        { error: 'Failed to check rental status' },
        { status: 500 }
      )
    }

    // Retourner le statut de location
    const isCurrentlyRented = !!rental

    return NextResponse.json({
      movieId,
      isCurrentlyRented,
      rentalId: rental?.id || null
    })

  } catch (error) {
    console.error('Unexpected error in movie-rental-status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}