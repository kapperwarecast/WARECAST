import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Récupère la liste de tous les utilisateurs avec leurs statistiques
 * Réservé aux administrateurs
 */
export async function GET() {
  try {
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

    // Créer un client admin pour bypasser les RLS (nécessaire pour voir tous les utilisateurs)
    const adminClient = createAdminClient()

    // Récupérer tous les profils utilisateurs avec leurs statistiques
    const { data: profiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select(`
        id,
        username,
        prenom,
        nom,
        avatar_url,
        is_admin,
        stripe_customer_id,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('[GET /api/admin/users] Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des profils' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Récupérer les emails via auth.admin.listUsers()
    const { data: authData, error: authListError } = await adminClient.auth.admin.listUsers()

    if (authListError) {
      console.error('[GET /api/admin/users] Error fetching auth users:', authListError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des emails' },
        { status: 500 }
      )
    }

    const authUsers = authData?.users || []

    // Pour chaque utilisateur, récupérer ses statistiques
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        // Trouver l'email correspondant
        const authUser = authUsers.find(u => u.id === profile.id)

        // Compter les locations payantes (type='unitaire')
        const { count: paidRentalsCount } = await adminClient
          .from('emprunts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('type_emprunt', 'unitaire')

        // Compter les emprunts abonnement (type='abonnement')
        const { count: subscriptionRentalsCount } = await adminClient
          .from('emprunts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('type_emprunt', 'abonnement')

        // Récupérer le statut d'abonnement actuel
        const { data: subscription } = await adminClient
          .from('user_abonnements')
          .select('statut, date_expiration')
          .eq('user_id', profile.id)
          .single()

        // Déterminer le statut d'abonnement
        let subscriptionStatus: 'active' | 'resigned' | 'expired' | 'none' = 'none'

        if (subscription) {
          const expirationDate = new Date(subscription.date_expiration)
          const now = new Date()

          if (subscription.statut === 'actif') {
            subscriptionStatus = 'active'
          } else if (subscription.statut === 'résilié' && expirationDate > now) {
            subscriptionStatus = 'resigned'
          } else if (expirationDate < now) {
            subscriptionStatus = 'expired'
          }
        }

        return {
          id: profile.id,
          email: authUser?.email || null,
          username: profile.username,
          prenom: profile.prenom,
          nom: profile.nom,
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin,
          stripe_customer_id: profile.stripe_customer_id,
          created_at: profile.created_at,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          subscription_status: subscriptionStatus,
          subscription_expires_at: subscription?.date_expiration || null,
          total_paid_rentals: paidRentalsCount || 0,
          total_subscription_rentals: subscriptionRentalsCount || 0,
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('[GET /api/admin/users] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
