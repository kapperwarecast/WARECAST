"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Sparkles, AlertCircle, Film } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSubscription } from "@/hooks/use-subscription"
import { getSubscriptionDisplayStatus } from "@/lib/utils/subscription"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

export default function AbonnementPage() {
  const [user, setUser] = useState<User | null>(null)
  const [, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    availableSubscriptions,
    loadingSubscriptions,
    userSubscription,
    hasActiveSubscription,
    daysUntilExpiration,
    subscribe,
    cancelSubscription
  } = useSubscription(user)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setProfile(profile)
      }
      
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSubscribe = async (abonnementId: string) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Vous devez être connecté pour vous abonner' })
      return
    }

    setSubscribing(abonnementId)
    setMessage(null)

    try {
      // Appeler l'API pour créer la session Stripe Checkout
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abonnement_id: abonnementId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la création du paiement' })
        setSubscribing(null)
        return
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: 'URL de paiement non disponible' })
        setSubscribing(null)
      }
    } catch (error) {
      console.error('Erreur lors de la souscription:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la souscription' })
      setSubscribing(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Vous devez être connecté' })
      return
    }

    setCancelling(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la résiliation' })
      } else {
        setMessage({ type: 'success', text: data.message || 'Votre abonnement a été résilié. Vous pouvez continuer à profiter de vos avantages jusqu\'à la date d\'expiration.' })
        // Rafraîchir l'abonnement utilisateur
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors de la résiliation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la résiliation' })
    } finally {
      setCancelling(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Vous devez être connecté' })
      return
    }

    setCancelling(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la réactivation' })
      } else {
        setMessage({ type: 'success', text: data.message || 'Votre abonnement a été réactivé avec succès.' })
        // Rafraîchir l'abonnement utilisateur
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la réactivation' })
    } finally {
      setCancelling(false)
    }
  }

  const formatPrice = (prix: number) => {
    return prix.toFixed(2).replace('.', ',')
  }

  const calculateSavings = (monthlyPrice: number, annualPrice: number, months: number) => {
    const totalMonthlyPrice = monthlyPrice * months
    return totalMonthlyPrice - annualPrice
  }

  if (loading || loadingSubscriptions) {
    return (
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-zinc-800 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const monthlyPlan = availableSubscriptions.find(a => a.duree_mois === 1)

  // Calculer le statut d'affichage de l'abonnement
  const subscriptionStatus = getSubscriptionDisplayStatus(userSubscription)

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-orange-500" />
            <h1 className="text-4xl font-bold">Abonnements Warecast</h1>
          </div>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choisissez votre formule et profitez de notre catalogue de films uniques
          </p>
        </div>

        {/* Message de feedback */}
        {message && (
          <div className={`max-w-4xl mx-auto mb-8 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/20 border-green-500 text-green-400'
              : 'bg-red-900/20 border-red-500 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Section À la carte */}
            <Card className={`bg-zinc-900 transition-colors relative ${
              !hasActiveSubscription
                ? 'border-blue-500 bg-blue-900/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}>
              {!hasActiveSubscription && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1 text-sm font-medium">
                    Formule actuelle
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Film className="h-6 w-6 text-zinc-400" />
                  <CardTitle className="text-2xl">À la carte</CardTitle>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    1,50€
                  </div>
                  <div className="text-zinc-400">par film</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Aucun engagement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Paiement à l&apos;usage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Accès à tout le catalogue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Parfait pour découvrir</span>
                  </div>
                </div>
                {!hasActiveSubscription ? (
                  <Button asChild variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800" size="lg">
                    <Link href="/">Explorer le catalogue</Link>
                  </Button>
                ) : subscriptionStatus.isScheduledForCancellation ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full border-blue-500 text-blue-400"
                    size="lg"
                  >
                    Formule activée à l&apos;expiration
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="lg"
                  >
                    {cancelling ? "Résiliation..." : "Choisir cette formule"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Section Abonnement */}
            <Card className={`bg-zinc-900 transition-colors relative ${
                hasActiveSubscription
                  ? 'border-orange-500 bg-orange-900/10'
                  : 'border-orange-500 hover:border-orange-400'
              }`}>
                {hasActiveSubscription && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-4 py-1 text-sm font-medium">
                      Formule actuelle
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-orange-500" />
                    <CardTitle className="text-2xl">Abonnement</CardTitle>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      5€
                    </div>
                    <div className="text-zinc-400">par mois</div>
                    {hasActiveSubscription && userSubscription && (
                      subscriptionStatus.isScheduledForCancellation ? (
                        <div className="text-sm text-orange-400 mt-2">
                          Expire le {new Date(userSubscription.date_expiration).toLocaleDateString('fr-FR')}
                          {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                            <span className="ml-1">
                              ({daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''} restant{daysUntilExpiration > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-green-400 mt-2">
                          Prochain prélèvement le {new Date(userSubscription.date_expiration).toLocaleDateString('fr-FR')}
                        </div>
                      )
                    )}
                  </div>
                </CardHeader>

                {/* Message de résiliation permanent */}
                {subscriptionStatus.isScheduledForCancellation && (
                  <div className="px-6 pb-4">
                    <div className="bg-orange-900/20 border border-orange-500 text-orange-400 p-4 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span>{subscriptionStatus.message}</span>
                      </div>
                    </div>
                  </div>
                )}
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Emprunts illimités de films</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Accès à tout le catalogue</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Pas de frais supplémentaires</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Résiliation à tout moment</span>
                    </div>
                  </div>
                  {!user ? (
                    <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      <a href="/auth/login">Se connecter pour s&apos;abonner</a>
                    </Button>
                  ) : hasActiveSubscription ? (
                    subscriptionStatus.canReactivate ? (
                      <Button
                        onClick={handleReactivateSubscription}
                        disabled={cancelling}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        size="lg"
                      >
                        {cancelling ? "Réactivation..." : "Réactiver"}
                      </Button>
                    ) : subscriptionStatus.canCancel ? (
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        variant="outline"
                        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                        size="lg"
                      >
                        {cancelling ? "Résiliation..." : "Résilier"}
                      </Button>
                    ) : (
                      <Button disabled className="w-full" size="lg">
                        Abonnement expiré
                      </Button>
                    )
                  ) : monthlyPlan ? (
                    <Button
                      onClick={() => handleSubscribe(monthlyPlan.id)}
                      disabled={subscribing === monthlyPlan.id}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      {subscribing === monthlyPlan.id ? "Souscription..." : "Choisir ce plan"}
                    </Button>
                  ) : (
                    <Button disabled className="w-full" size="lg">
                      Plan non disponible
                    </Button>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  )
}