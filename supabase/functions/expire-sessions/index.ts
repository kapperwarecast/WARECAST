/**
 * Edge Function: Expiration automatique des sessions de visionnage
 *
 * Correction Bug #4 (Scénario #22): Sessions expirées (>48h) non automatiques
 *
 * Cette fonction appelle le RPC `expire_overdue_sessions()` qui marque
 * comme expirées toutes les sessions dépassant 48h.
 *
 * Configuration cron recommandée: Toutes les heures (0 * * * *)
 *
 * @see supabase/migrations/20251120_create_utility_rpc_functions.sql
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Interface pour le typage de la réponse
interface ExpireSessionsResponse {
  expired_count: number
  timestamp: string
  error?: string
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now()

  try {
    // Créer client Supabase avec service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Appeler le RPC qui expire les sessions
    const { data: expiredCount, error } = await supabase.rpc('expire_overdue_sessions')

    if (error) {
      console.error('❌ Erreur lors de l\'expiration des sessions:', error)

      return new Response(
        JSON.stringify({
          expired_count: 0,
          timestamp: new Date().toISOString(),
          error: error.message,
        } satisfies ExpireSessionsResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const duration = Date.now() - startTime
    console.log(`✅ ${expiredCount} session(s) expirée(s) en ${duration}ms`)

    return new Response(
      JSON.stringify({
        expired_count: expiredCount ?? 0,
        timestamp: new Date().toISOString(),
      } satisfies ExpireSessionsResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Exception non gérée:', error)

    return new Response(
      JSON.stringify({
        expired_count: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      } satisfies ExpireSessionsResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/* Configuration cron (Supabase Dashboard):
 *
 * 1. Aller sur: https://supabase.com/dashboard/project/[PROJECT_ID]/functions
 * 2. Cliquer sur "expire-sessions"
 * 3. Onglet "Settings" → Section "Cron Jobs"
 * 4. Ajouter cron job:
 *    - Name: "Expire overdue viewing sessions"
 *    - Schedule: "0 * * * *" (toutes les heures)
 *    - HTTP Method: POST
 *    - Headers: (laisser vide)
 * 5. Sauvegarder
 *
 * Format cron:
 * ┌───────────── minute (0 - 59)
 * │ ┌───────────── heure (0 - 23)
 * │ │ ┌───────────── jour du mois (1 - 31)
 * │ │ │ ┌───────────── mois (1 - 12)
 * │ │ │ │ ┌───────────── jour de la semaine (0 - 6) (Dimanche=0)
 * │ │ │ │ │
 * │ │ │ │ │
 * * * * * *
 *
 * Exemples:
 * - "0 * * * *"    = Toutes les heures (recommandé)
 * - "*/30 * * * *" = Toutes les 30 minutes
 * - "0 0 * * *"    = Une fois par jour à minuit
 * - "0 */2 * * *"  = Toutes les 2 heures
 */
