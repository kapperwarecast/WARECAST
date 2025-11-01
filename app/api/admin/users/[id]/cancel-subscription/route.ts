import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/admin/users/[id]/cancel-subscription
 * Résilie l'abonnement d'un utilisateur
 * Réservé aux administrateurs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les droits admin de l'appelant
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Accès interdit - droits administrateur requis' },
        { status: 403 }
      )
    }

    // Récupérer l'abonnement actif de l'utilisateur cible
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_abonnements')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('statut', 'actif')
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé pour cet utilisateur' },
        { status: 404 }
      )
    }

    // Annuler l'abonnement Stripe si stripe_subscription_id existe
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        console.log('[POST /api/admin/users/[id]/cancel-subscription] Stripe subscription cancelled:', subscription.stripe_subscription_id)
      } catch (stripeError) {
        console.error('[POST /api/admin/users/[id]/cancel-subscription] Stripe error:', stripeError)
        // Continue même si erreur Stripe
      }
    }

    // Mettre à jour le statut de l'abonnement en DB
    const { error: updateError } = await supabase
      .from('user_abonnements')
      .update({ statut: 'résilié' })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('[POST /api/admin/users/[id]/cancel-subscription] Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la résiliation de l\'abonnement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Abonnement résilié avec succès',
      expires_at: subscription.date_expiration
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[id]/cancel-subscription] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
