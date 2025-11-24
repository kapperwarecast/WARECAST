import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/films/registry/create
 * Crée une copie physique directement dans le registre (dépôt admin direct)
 * Réservé aux administrateurs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, ownerId, physicalSupportType, notes } = body
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les droits admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Accès interdit - droits administrateur requis' },
        { status: 403 }
      )
    }

    // Valider les paramètres
    if (!movieId || !ownerId || !physicalSupportType) {
      return NextResponse.json(
        { error: 'movieId, ownerId et physicalSupportType sont requis' },
        { status: 400 }
      )
    }

    // Valider le type de support
    const validSupportTypes = ['Blu-ray', 'DVD', '4k']
    if (!validSupportTypes.includes(physicalSupportType)) {
      return NextResponse.json(
        { error: `Type de support invalide. Valeurs acceptées: ${validSupportTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Vérifier que le film existe
    const { data: movie, error: movieError } = await adminClient
      .from('movies')
      .select('id, titre_francais')
      .eq('id', movieId)
      .single()

    if (movieError || !movie) {
      return NextResponse.json(
        { error: 'Film non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le propriétaire existe
    const { data: owner, error: ownerError } = await adminClient
      .from('user_profiles')
      .select('id, prenom, nom')
      .eq('id', ownerId)
      .single()

    if (ownerError || !owner) {
      return NextResponse.json(
        { error: 'Propriétaire non trouvé' },
        { status: 404 }
      )
    }

    // Créer l'entrée dans films_registry
    const { data: registryEntry, error: registryError } = await adminClient
      .from('films_registry')
      .insert({
        movie_id: movieId,
        current_owner_id: ownerId,
        physical_support_type: physicalSupportType,
        acquisition_method: 'deposit',
        acquisition_date: new Date().toISOString(),
        deposit_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (registryError) {
      console.error('[POST /api/admin/films/registry/create] Error creating registry entry:', registryError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la copie physique' },
        { status: 500 }
      )
    }

    // Créer l'entrée dans ownership_history
    const { error: historyError } = await adminClient
      .from('ownership_history')
      .insert({
        film_registry_id: registryEntry.id,
        from_owner_id: null, // Dépôt initial (pas de propriétaire précédent)
        to_owner_id: ownerId,
        transfer_type: 'deposit',
        transfer_date: new Date().toISOString(),
      })

    if (historyError) {
      console.error('[POST /api/admin/films/registry/create] Error creating history entry:', historyError)
      // Non bloquant, on continue
    }

    console.log(`[POST /api/admin/films/registry/create] Copie physique créée: ${movie.titre_francais} (${physicalSupportType}) → ${owner.prenom} ${owner.nom}`)

    return NextResponse.json({
      success: true,
      registry: registryEntry,
      message: `Copie physique créée avec succès pour ${owner.prenom} ${owner.nom}`
    })
  } catch (error) {
    console.error('[POST /api/admin/films/registry/create] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
