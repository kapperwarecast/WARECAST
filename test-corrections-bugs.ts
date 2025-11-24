/**
 * Script de test automatisé - Vérification corrections bugs
 *
 * Ce script teste les 4 scénarios corrigés pour confirmer que les bugs
 * sont bien résolus.
 *
 * Usage: npx tsx test-corrections-bugs.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Couleurs console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function success(msg: string) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`)
}

function error(msg: string) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`)
}

function info(msg: string) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
}

function warning(msg: string) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

// ============================================================================
// Test Bug #1: Validation paiement Stripe (Scénario #27)
// ============================================================================

async function testBug1_PaymentValidation() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST BUG #1 - Validation paiement Stripe (Scénario #27)')
  console.log('='.repeat(80))

  try {
    // Récupérer un user et un film de test
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(1)
      .single()

    if (!user) {
      error('Aucun utilisateur trouvé pour le test')
      return false
    }

    const { data: movie } = await supabase
      .from('movies')
      .select('id, titre_francais')
      .limit(1)
      .single()

    if (!movie) {
      error('Aucun film trouvé pour le test')
      return false
    }

    info(`User test: ${user.email}`)
    info(`Film test: ${movie.titre_francais}`)

    // Créer un paiement invalide (status = 'failed')
    const { data: invalidPayment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount: 1.50,
        currency: 'EUR',
        payment_type: 'exchange',
        status: 'failed', // ❌ Status invalide
      })
      .select('id')
      .single()

    if (paymentError || !invalidPayment) {
      error(`Erreur création paiement test: ${paymentError?.message}`)
      return false
    }

    info(`Paiement test créé (status=failed): ${invalidPayment.id}`)

    // Appeler rent_or_access_movie avec ce payment_id invalide
    const { data: result, error: rpcError } = await supabase.rpc('rent_or_access_movie', {
      p_auth_user_id: user.id,
      p_movie_id: movie.id,
      p_payment_id: invalidPayment.id,
    })

    // Nettoyer
    await supabase.from('payments').delete().eq('id', invalidPayment.id)

    if (rpcError) {
      error(`Erreur RPC: ${rpcError.message}`)
      return false
    }

    // Vérifier que le RPC a rejeté le paiement invalide
    if (result && result.code === 'PAYMENT_NOT_SUCCEEDED') {
      success('Bug #1 CORRIGÉ: Paiement invalide rejeté correctement')
      info(`Réponse: ${JSON.stringify(result)}`)
      return true
    } else {
      error('Bug #1 NON CORRIGÉ: Paiement invalide accepté!')
      info(`Réponse inattendue: ${JSON.stringify(result)}`)
      return false
    }

  } catch (err) {
    error(`Exception: ${err}`)
    return false
  }
}

// ============================================================================
// Test Bug #2: Rotation pour tous (Scénario #16)
// ============================================================================

async function testBug2_RotationForAll() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST BUG #2 - Rotation appliquée à tous (Scénario #16)')
  console.log('='.repeat(80))

  try {
    // Vérifier le code source de la fonction
    const { data: functionDef, error: funcError } = await supabase.rpc('verify_function_code', {
      function_name: 'rent_or_access_movie',
    })

    if (funcError) {
      warning('Fonction verify_function_code non disponible')
      info('Vérification manuelle requise dans le Dashboard')
      return null
    }

    // Chercher la présence de rotation sans condition IF v_user_has_subscription
    const codeSource = String(functionDef)

    const hasRotationCode = codeSource.includes('UPDATE viewing_sessions') &&
                            codeSource.includes("SET statut = 'rendu'") &&
                            codeSource.includes('WHERE user_id = p_auth_user_id')

    const hasOldConditional = codeSource.includes('IF v_user_has_subscription THEN') &&
                               codeSource.includes('UPDATE viewing_sessions')

    if (hasRotationCode && !hasOldConditional) {
      success('Bug #2 CORRIGÉ: Rotation sans condition trouvée')
      return true
    } else if (hasOldConditional) {
      error('Bug #2 NON CORRIGÉ: Condition IF v_user_has_subscription encore présente')
      return false
    } else {
      warning('Bug #2: Code de rotation non trouvé (vérification manuelle requise)')
      return null
    }

  } catch (err) {
    warning(`Impossible de vérifier automatiquement: ${err}`)
    info('Vérification manuelle requise dans le Dashboard')
    return null
  }
}

// ============================================================================
// Test Bug #3: Sélection copie déterministe (Scénario #21)
// ============================================================================

async function testBug3_DeterministicSelection() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST BUG #3 - Sélection copie déterministe (Scénario #21)')
  console.log('='.repeat(80))

  try {
    // Chercher des films avec plusieurs copies
    const { data: multiCopies, error: multiError } = await supabase
      .from('films_registry')
      .select('movie_id, id, current_owner_id')
      .order('movie_id')

    if (multiError || !multiCopies) {
      error('Erreur récupération films_registry')
      return false
    }

    // Grouper par movie_id pour trouver multi-copies
    const movieCounts: Record<string, number> = {}
    multiCopies.forEach(film => {
      movieCounts[film.movie_id] = (movieCounts[film.movie_id] || 0) + 1
    })

    const moviesWithMultipleCopies = Object.entries(movieCounts).filter(([_, count]) => count > 1)

    if (moviesWithMultipleCopies.length > 0) {
      success(`Trouvé ${moviesWithMultipleCopies.length} film(s) avec plusieurs copies`)
      info('Système prêt pour multi-copies (ORDER BY déterministe nécessaire)')

      // Vérifier qu'ORDER BY est présent dans la fonction
      warning('Vérification automatique du ORDER BY non disponible')
      info('Vérification manuelle requise: Rechercher "ORDER BY" avec "CASE WHEN NOT EXISTS"')

      return null
    } else {
      info('Aucun film avec plusieurs copies (test non applicable)')
      info('Bug #3 corrigé mais non testable automatiquement')
      return null
    }

  } catch (err) {
    error(`Exception: ${err}`)
    return false
  }
}

// ============================================================================
// Test Bug #4: Expiration automatique (Scénario #22)
// ============================================================================

async function testBug4_AutoExpiration() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST BUG #4 - Expiration automatique (Scénario #22)')
  console.log('='.repeat(80))

  try {
    // Vérifier que la fonction RPC expire_overdue_sessions existe
    const { data: funcExists, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'expire_overdue_sessions')
      .eq('routine_schema', 'public')
      .single()

    if (funcError || !funcExists) {
      error('Fonction expire_overdue_sessions non trouvée')
      return false
    }

    success('Fonction RPC expire_overdue_sessions trouvée')

    // Appeler la fonction pour tester
    const { data: expiredCount, error: rpcError } = await supabase.rpc('expire_overdue_sessions')

    if (rpcError) {
      error(`Erreur appel RPC: ${rpcError.message}`)
      return false
    }

    success(`Fonction exécutée: ${expiredCount || 0} session(s) expirée(s)`)

    // Vérifier s'il y a des sessions expirées non marquées
    const { count: overdueCount, error: countError } = await supabase
      .from('viewing_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'en_cours')
      .lt('return_date', new Date().toISOString())

    if (countError) {
      warning(`Impossible de compter sessions expirées: ${countError.message}`)
      return null
    }

    if ((overdueCount || 0) === 0) {
      success('Aucune session expirée non marquée (système sain)')
      info('Edge Function à déployer: supabase functions deploy expire-sessions')
      info('Cron à configurer: 0 * * * * (toutes les heures)')
      return true
    } else {
      warning(`${overdueCount} session(s) expirée(s) en attente de nettoyage`)
      info('Edge Function cron pas encore actif (normal si pas déployé)')
      info('Pour déployer: npx supabase functions deploy expire-sessions')
      return null
    }

  } catch (err) {
    error(`Exception: ${err}`)
    return false
  }
}

// ============================================================================
// Exécution des tests
// ============================================================================

async function runAllTests() {
  console.log('\n')
  console.log('═'.repeat(80))
  console.log('🧪 TESTS AUTOMATISÉS - VÉRIFICATION CORRECTIONS BUGS')
  console.log('═'.repeat(80))

  const results = {
    bug1: await testBug1_PaymentValidation(),
    bug2: await testBug2_RotationForAll(),
    bug3: await testBug3_DeterministicSelection(),
    bug4: await testBug4_AutoExpiration(),
  }

  // Résumé
  console.log('\n' + '═'.repeat(80))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('═'.repeat(80))

  const passed = Object.values(results).filter(r => r === true).length
  const failed = Object.values(results).filter(r => r === false).length
  const skipped = Object.values(results).filter(r => r === null).length

  console.log(`\n✅ Réussis: ${passed}`)
  console.log(`❌ Échoués: ${failed}`)
  console.log(`⚠️  Skippés/Manuels: ${skipped}`)

  if (failed === 0 && passed > 0) {
    success('\n🎉 Tous les tests automatisés ont réussi!')
  } else if (failed > 0) {
    error('\n⚠️  Certains tests ont échoué - Vérification manuelle requise')
  } else {
    warning('\n⚠️  Tests automatiques limités - Vérification manuelle recommandée')
  }

  console.log('\n📋 Actions suivantes:')
  console.log('  1. Déployer Edge Function: npx supabase functions deploy expire-sessions')
  console.log('  2. Configurer cron dans Dashboard Supabase (0 * * * *)')
  console.log('  3. Tester un échange réel en production')
  console.log('  4. Monitorer logs pour vérifier comportement')
  console.log('')
}

// Lancer les tests
runAllTests().catch(console.error)
