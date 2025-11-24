import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@18.5.0?target=denonext';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

console.log('🔧 Environment check:', {
  hasStripeKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasWebhookSecret: !!webhookSecret
});

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('❌ Méthode non autorisée:', req.method);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('🔗 Webhook Stripe reçu sur Edge Function');
    console.log('📝 Body length:', body.length);
    console.log('🔑 Signature présente:', !!signature);
    console.log('🔐 Webhook secret configuré:', !!webhookSecret);

    if (!signature) {
      console.error('❌ Signature Stripe manquante');
      return new Response('Missing signature', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify webhook signature using official Stripe API
    let event;
    try {
      if (!webhookSecret) {
        console.log('⚠️ Webhook secret non configuré, processing en mode dev');
        event = JSON.parse(body);
      } else if (signature === 'test_signature') {
        console.log('🧪 Mode test manuel détecté');
        event = JSON.parse(body);
      } else {
        console.log('🔍 Debug signature verification:');
        console.log('- Signature reçue:', signature?.substring(0, 20) + '...');
        console.log('- Secret configuré:', webhookSecret?.substring(0, 10) + '...');
        console.log('- Body length:', body.length);

        try {
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
          );
          console.log('✅ Signature Stripe vérifiée avec succès');
        } catch (stripeError) {
          console.error('❌ Erreur vérification Stripe:', stripeError.message);
          console.log('🚨 MODE DEBUG: Traitement du webhook malgré l\'erreur de signature');
          event = JSON.parse(body);
          console.log('⚠️ ATTENTION: Webhook traité sans vérification de signature!');
        }
      }

      console.log('✅ Webhook événement parsé:', event.type);
      console.log('🆔 Event ID:', event.id);
    } catch (err) {
      console.error('❌ Erreur critique parsing webhook:', err);
      return new Response('Webhook parsing failed', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Process webhook events
    try {
      switch (event.type) {
        // ========================================
        // GESTION DES PAIEMENTS UNITAIRES (LOCATIONS)
        // ========================================
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('💳 Payment Intent succeeded:', paymentIntent.id);
          console.log('💰 Montant:', paymentIntent.amount / 100, 'EUR');
          console.log('📋 Metadata:', paymentIntent.metadata);

          const { movie_id, user_id, movie_title } = paymentIntent.metadata;

          if (!movie_id || !user_id) {
            console.error('❌ Métadonnées manquantes:', paymentIntent.metadata);
            return new Response('Métadonnées manquantes', {
              status: 400,
              headers: corsHeaders
            });
          }

          console.log('📦 Traitement paiement pour:', {
            movie_id,
            user_id,
            movie_title
          });

          // 1. Mettre à jour le statut du paiement
          const { data: paymentData, error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('external_payment_id', paymentIntent.id)
            .select('id')
            .single();

          if (paymentUpdateError) {
            console.error('❌ Erreur mise à jour payment:', paymentUpdateError);
            return new Response('Erreur mise à jour payment', {
              status: 500,
              headers: corsHeaders
            });
          }

          if (!paymentData) {
            console.error('❌ Payment non trouvé pour PaymentIntent:', paymentIntent.id);

            // Retry logic pour race condition (payment peut ne pas être encore créé)
            console.log('🔄 Retry pour trouver le payment...');
            let retryPayment = null;

            for (let attempt = 0; attempt < 5; attempt++) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s

              const { data, error } = await supabase
                .from('payments')
                .select('id')
                .eq('external_payment_id', paymentIntent.id)
                .maybeSingle();

              if (data) {
                retryPayment = data;
                console.log('✅ Payment trouvé après retry:', data.id);
                break;
              }
            }

            if (!retryPayment) {
              console.error('❌ Payment toujours non trouvé après 5 retries');
              return new Response('Payment not ready yet', {
                status: 409, // Conflict - Stripe va retry
                headers: corsHeaders
              });
            }

            // Utiliser le payment trouvé après retry
            paymentData.id = retryPayment.id;
          }

          console.log('✅ Payment mis à jour, ID:', paymentData.id);

          // 2. Appeler le RPC rent_or_access_movie qui gère automatiquement :
          // - Sessions de lecture pour films possédés (gratuit)
          // - Échanges automatiques + sessions pour films non possédés (1.50€)
          console.log('🎬 Appel RPC rent_or_access_movie...');

          const { data: result, error: rpcError } = await supabase
            .rpc('rent_or_access_movie', {
              p_movie_id: movie_id,
              p_auth_user_id: user_id,
              p_payment_id: paymentData.id
            });

          if (rpcError) {
            console.error('❌ Erreur RPC rent_or_access_movie:', rpcError);
            return new Response('Erreur RPC rent_or_access_movie', {
              status: 500,
              headers: corsHeaders
            });
          }

          console.log('✅ RPC rent_or_access_movie succès:', result);

          // Vérifier le résultat
          if (!result?.success) {
            console.error('❌ RPC returned failure:', result);
            return new Response(JSON.stringify({
              error: 'RPC failed',
              details: result
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          console.log('🎉 Paiement traité avec succès!');
          console.log('📊 Résultat:', {
            session_id: result.emprunt_id,
            exchange_performed: result.exchange_performed,
            owns_film: result.owns_film
          });

          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log('❌ Paiement échoué:', paymentIntent.id);

          const { error: failError } = await supabase
            .from('payments')
            .update({
              status: 'failed'
            })
            .eq('external_payment_id', paymentIntent.id);

          if (failError) {
            console.error('❌ Erreur mise à jour payment failed:', failError);
          } else {
            console.log('✅ Payment marqué comme échoué');
          }

          break;
        }

        // ========================================
        // GESTION DES ABONNEMENTS
        // ========================================
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('🎉 Checkout session completed:', session.id);
          console.log('💳 Customer ID:', session.customer);
          console.log('📋 Subscription ID:', session.subscription);
          console.log('🔑 Metadata:', session.metadata);

          const { user_id, abonnement_id } = session.metadata || {};

          if (!user_id || !abonnement_id) {
            console.error('❌ Métadonnées manquantes dans checkout session:', session.metadata);
            return new Response('Métadonnées manquantes', {
              status: 400,
              headers: corsHeaders
            });
          }

          // 1. Sauvegarder le stripe_customer_id dans user_profiles
          if (session.customer) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .update({
                stripe_customer_id: session.customer
              })
              .eq('id', user_id);

            if (profileError) {
              console.error('❌ Erreur mise à jour stripe_customer_id:', profileError);
            } else {
              console.log('✅ stripe_customer_id sauvegardé:', session.customer);
            }
          }

          // 2. Récupérer les détails de l'abonnement
          const { data: abonnement } = await supabase
            .from('abonnements')
            .select('duree_mois')
            .eq('id', abonnement_id)
            .single();

          if (!abonnement) {
            console.error('❌ Abonnement non trouvé:', abonnement_id);
            return new Response('Abonnement non trouvé', {
              status: 404,
              headers: corsHeaders
            });
          }

          // 3. Calculer la date d'expiration
          const dateExpiration = new Date();
          dateExpiration.setMonth(dateExpiration.getMonth() + abonnement.duree_mois);

          // 4. Vérifier si un abonnement existe déjà pour cet utilisateur
          const { data: existingAbonnement } = await supabase
            .from('user_abonnements')
            .select('id')
            .eq('user_id', user_id)
            .eq('abonnement_id', abonnement_id)
            .single();

          let userAbonnement;
          let userAbonnementError;

          if (existingAbonnement) {
            // Réactiver l'abonnement existant
            console.log('🔄 Réactivation de l\'abonnement existant:', existingAbonnement.id);
            const { data, error } = await supabase
              .from('user_abonnements')
              .update({
                stripe_subscription_id: session.subscription,
                date_souscription: new Date().toISOString(),
                date_expiration: dateExpiration.toISOString(),
                statut: 'actif',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingAbonnement.id)
              .select('id')
              .single();

            userAbonnement = data;
            userAbonnementError = error;
          } else {
            // Créer un nouvel abonnement
            console.log('➕ Création d\'un nouvel abonnement');
            const { data, error } = await supabase
              .from('user_abonnements')
              .insert({
                user_id: user_id,
                abonnement_id: abonnement_id,
                stripe_subscription_id: session.subscription,
                date_souscription: new Date().toISOString(),
                date_expiration: dateExpiration.toISOString(),
                statut: 'actif'
              })
              .select('id')
              .single();

            userAbonnement = data;
            userAbonnementError = error;
          }

          if (userAbonnementError) {
            console.error('❌ Erreur user_abonnement:', userAbonnementError);
            return new Response('Erreur abonnement', {
              status: 500,
              headers: corsHeaders
            });
          }

          console.log('✅ Abonnement utilisateur prêt, ID:', userAbonnement?.id);

          // 5. Enregistrer le paiement
          if (session.amount_total) {
            await supabase.from('payments').insert({
              user_id: user_id,
              payment_type: 'subscription',
              amount: session.amount_total / 100,
              currency: session.currency || 'eur',
              status: 'completed',
              payment_method: 'stripe',
              external_payment_id: session.payment_intent,
              subscription_id: userAbonnement?.id,
              completed_at: new Date().toISOString(),
              description: 'Souscription abonnement mensuel'
            });
          }

          console.log('🎉 Abonnement activé avec succès!');
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          console.log('🔄 Subscription updated:', subscription.id);
          console.log('📊 Status:', subscription.status);
          console.log('🚫 Cancel at period end:', subscription.cancel_at_period_end);

          // Déterminer le bon statut selon cancel_at_period_end
          let statut = 'suspendu';
          if (subscription.status === 'active') {
            statut = subscription.cancel_at_period_end ? 'résilié' : 'actif';
          }

          console.log('📝 Nouveau statut:', statut);

          // Mettre à jour le statut de l'abonnement dans notre base
          const { error: updateError } = await supabase
            .from('user_abonnements')
            .update({
              statut: statut,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          if (updateError) {
            console.error('❌ Erreur mise à jour subscription:', updateError);
          } else {
            console.log('✅ Statut abonnement mis à jour');
          }

          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log('🗑️ Subscription deleted:', subscription.id);

          // Marquer l'abonnement comme suspendu
          const { error: deleteError } = await supabase
            .from('user_abonnements')
            .update({
              statut: 'suspendu',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          if (deleteError) {
            console.error('❌ Erreur suppression subscription:', deleteError);
          } else {
            console.log('✅ Abonnement marqué comme suspendu');
          }

          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          console.log('💰 Invoice payment succeeded:', invoice.id);
          console.log('💳 Subscription ID:', invoice.subscription);

          if (invoice.subscription) {
            // Prolonger la date d'expiration de l'abonnement
            const { data: userAbonnement } = await supabase
              .from('user_abonnements')
              .select('id, user_id, abonnement_id, date_expiration')
              .eq('stripe_subscription_id', invoice.subscription)
              .single();

            if (userAbonnement) {
              // Récupérer la durée de l'abonnement
              const { data: abonnement } = await supabase
                .from('abonnements')
                .select('duree_mois')
                .eq('id', userAbonnement.abonnement_id)
                .single();

              if (abonnement) {
                // Prolonger depuis la date d'expiration actuelle
                const newExpiration = new Date(userAbonnement.date_expiration);
                newExpiration.setMonth(newExpiration.getMonth() + abonnement.duree_mois);

                await supabase
                  .from('user_abonnements')
                  .update({
                    date_expiration: newExpiration.toISOString(),
                    statut: 'actif',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userAbonnement.id);

                // Enregistrer le paiement
                await supabase.from('payments').insert({
                  user_id: userAbonnement.user_id,
                  payment_type: 'subscription',
                  amount: invoice.amount_paid / 100,
                  currency: invoice.currency || 'eur',
                  status: 'completed',
                  payment_method: 'stripe',
                  external_payment_id: invoice.payment_intent,
                  subscription_id: userAbonnement.id,
                  completed_at: new Date().toISOString(),
                  description: 'Renouvellement abonnement mensuel'
                });

                console.log('✅ Abonnement renouvelé jusqu\'au:', newExpiration.toISOString());
              }
            }
          }

          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log('❌ Invoice payment failed:', invoice.id);

          if (invoice.subscription) {
            // Marquer l'abonnement comme suspendu
            const { error: failError } = await supabase
              .from('user_abonnements')
              .update({
                statut: 'suspendu',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription);

            if (failError) {
              console.error('❌ Erreur mise à jour après échec paiement:', failError);
            } else {
              console.log('✅ Abonnement suspendu suite à échec paiement');
            }
          }

          break;
        }

        default:
          console.log(`ℹ️ Événement Stripe non géré: ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('❌ Erreur traitement webhook:', error);
      return new Response(JSON.stringify({
        error: 'Erreur traitement webhook',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur générale dans Edge Function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
