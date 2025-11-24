import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/user
 * Retourne les informations de l'utilisateur connecté
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, prenom, nom, username, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[GET /api/user] Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        email: user.email,
        ...profile
      }
    })
  } catch (error) {
    console.error('[GET /api/user] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
