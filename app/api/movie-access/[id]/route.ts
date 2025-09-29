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

    // 1. Vérifier si l'utilisateur a un abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from('user_abonnements')
      .select('statut, date_expiration')
      .eq('user_id', user.id)
      .eq('statut', 'actif')
      .gt('date_expiration', new Date().toISOString())
      .order('date_expiration', { ascending: false })
      .limit(1)
      .single()

    // Si l'utilisateur a un abonnement actif, accès accordé
    if (subscription && !subError) {
      return NextResponse.json({
        hasAccess: true,
        reason: 'subscription',
        movieId
      })
    }

    // 2. Vérifier si l'utilisateur a loué ce film spécifique (et que c'est encore valide)
    const { data: rental, error: rentalError } = await supabase
      .from('emprunts')
      .select('id, statut, date_retour')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .eq('statut', 'en_cours')
      .gt('date_retour', new Date().toISOString()) // Vérifier que la location n'est pas expirée
      .single()

    if (rental && !rentalError) {
      return NextResponse.json({
        hasAccess: true,
        reason: 'rental',
        movieId,
        rentalId: rental.id
      })
    }

    // 3. Aucun accès trouvé
    return NextResponse.json({
      hasAccess: false,
      reason: 'no_access',
      movieId
    })

  } catch (error) {
    console.error('Unexpected error in movie-access API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        hasAccess: false,
        movieId: (await params).id
      },
      { status: 500 }
    )
  }
}
