import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Fonction pour obtenir l'instance Stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  })
}

// Date conventionnelle pour les abonnements à vie (2099-12-31)
const LIFETIME_EXPIRATION_DATE = '2099-12-31T23:59:59.999Z'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Utiliser createClient() pour vérifier l'authentification
    const supabase = await createClient()
    const { id: userId } = await params

    // Vérifier que l'utilisateur connecté est admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Utiliser adminClient pour les opérations qui nécessitent de bypass RLS
    const adminClient = createAdminClient()

    // Vérifier les permissions admin avec adminClient (bypass RLS)
    const { data: adminData } = await adminClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer l'utilisateur cible
    const { data: targetUser } = await adminClient
      .from('user_profiles')
      .select('id, prenom, nom')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Récupérer l'email via auth
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
    const userEmail = authUser?.user?.email || 'utilisateur'

    // Récupérer l'abonnement actuel de l'utilisateur
    const { data: existingSubscription } = await adminClient
      .from('user_abonnements')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // Si l'utilisateur a un abonnement Stripe actif, l'annuler
    if (existingSubscription?.stripe_subscription_id) {
      try {
        const stripe = getStripe()
        await stripe.subscriptions.cancel(existingSubscription.stripe_subscription_id)
        console.log(`Abonnement Stripe annulé: ${existingSubscription.stripe_subscription_id}`)
      } catch (stripeError) {
        console.error('Erreur annulation Stripe:', stripeError)
        // Continue malgré l'erreur (l'abonnement sera quand même créé)
      }
    }

    // Récupérer un abonnement par défaut (pour avoir un abonnement_id valide)
    const { data: defaultAbonnement } = await adminClient
      .from('abonnements')
      .select('id')
      .eq('emprunts_illimites', true)
      .limit(1)
      .maybeSingle()

    if (!defaultAbonnement) {
      return NextResponse.json({
        error: 'Aucune formule d\'abonnement trouvée dans la base'
      }, { status: 500 })
    }

    // Créer ou mettre à jour l'abonnement à vie
    if (existingSubscription) {
      // Mise à jour de l'abonnement existant
      const { error: updateError } = await adminClient
        .from('user_abonnements')
        .update({
          date_expiration: LIFETIME_EXPIRATION_DATE,
          statut: 'actif',
          stripe_subscription_id: null, // Supprimer la référence Stripe
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Erreur mise à jour abonnement:', updateError)
        return NextResponse.json({
          error: 'Erreur lors de la mise à jour de l\'abonnement'
        }, { status: 500 })
      }
    } else {
      // Création d'un nouvel abonnement à vie
      const { error: insertError } = await adminClient
        .from('user_abonnements')
        .insert({
          user_id: userId,
          abonnement_id: defaultAbonnement.id,
          statut: 'actif',
          date_souscription: new Date().toISOString(),
          date_expiration: LIFETIME_EXPIRATION_DATE,
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Erreur création abonnement:', insertError)
        return NextResponse.json({
          error: 'Erreur lors de la création de l\'abonnement'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Abonnement à vie attribué à ${userEmail}`,
      user: {
        id: targetUser.id,
        email: userEmail,
        prenom: targetUser.prenom,
        nom: targetUser.nom
      }
    })

  } catch (error) {
    console.error('Erreur grant lifetime subscription:', error)
    return NextResponse.json({
      error: 'Erreur serveur lors de l\'attribution de l\'abonnement'
    }, { status: 500 })
  }
}
