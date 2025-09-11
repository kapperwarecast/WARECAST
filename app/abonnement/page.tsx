"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Sparkles, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

export default function AbonnementPage() {
  const [user, setUser] = useState<User | null>(null)
  const [, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    availableSubscriptions,
    loadingSubscriptions,
    userSubscription,
    hasActiveSubscription,
    daysUntilExpiration,
    subscribe
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
      const result = await subscribe(abonnementId)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Abonnement souscrit avec succès !' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la souscription' })
      }
    } finally {
      setSubscribing(null)
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
  const annualPlan = availableSubscriptions.find(a => a.duree_mois === 12)

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
            Choisissez votre formule et profitez d&apos;un accès illimité à notre catalogue de films uniques
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

        {/* Abonnement actuel */}
        {hasActiveSubscription && userSubscription && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-green-900/20 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">
                      Abonnement actuel : {userSubscription.abonnement.nom}
                    </h3>
                    <p className="text-zinc-300">
                      Expire le {new Date(userSubscription.date_expiration).toLocaleDateString('fr-FR')}
                      {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                        <span className="text-green-400 ml-2">
                          ({daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''} restant{daysUntilExpiration > 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    Actif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Plan Mensuel */}
            {monthlyPlan && (
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                    <CardTitle className="text-2xl">{monthlyPlan.nom}</CardTitle>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatPrice(monthlyPlan.prix)}€
                    </div>
                    <div className="text-zinc-400">par mois</div>
                  </div>
                </CardHeader>
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
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      <a href="/auth/login">Se connecter pour s&apos;abonner</a>
                    </Button>
                  ) : hasActiveSubscription ? (
                    <Button disabled className="w-full" size="lg">
                      Vous avez déjà un abonnement actif
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(monthlyPlan.id)}
                      disabled={subscribing === monthlyPlan.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {subscribing === monthlyPlan.id ? "Souscription..." : "Choisir ce plan"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plan Annuel */}
            {annualPlan && monthlyPlan && (
              <Card className="bg-zinc-900 border-orange-500 hover:border-orange-400 transition-colors relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-4 py-1 text-sm font-medium">
                    Économisez {formatPrice(calculateSavings(monthlyPlan.prix, annualPlan.prix, 12))}€
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-orange-500" />
                    <CardTitle className="text-2xl">{annualPlan.nom}</CardTitle>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatPrice(annualPlan.prix)}€
                    </div>
                    <div className="text-zinc-400">par an</div>
                    <div className="text-sm text-orange-400 mt-1">
                      Soit {formatPrice(annualPlan.prix / 12)}€/mois
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Tout du plan mensuel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-orange-400 font-medium">
                        2 mois offerts (économie de {formatPrice(calculateSavings(monthlyPlan.prix, annualPlan.prix, 12))}€)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Facturation annuelle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Priorité sur les nouveautés</span>
                    </div>
                  </div>
                  {!user ? (
                    <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      <a href="/auth/login">Se connecter pour s&apos;abonner</a>
                    </Button>
                  ) : hasActiveSubscription ? (
                    <Button disabled className="w-full" size="lg">
                      Vous avez déjà un abonnement actif
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(annualPlan.id)}
                      disabled={subscribing === annualPlan.id}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      {subscribing === annualPlan.id ? "Souscription..." : "Choisir ce plan"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info section */}
          <div className="mt-12 text-center">
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-3">Vous préférez tester avant de vous abonner ?</h3>
              <p className="text-zinc-400 mb-4">
                Empruntez des films à l&apos;unité pour seulement <strong className="text-white">1,50€</strong> par film.
                Une excellente façon de découvrir notre catalogue avant de vous engager.
              </p>
              <Button asChild variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
                <Link href="/">Explorer le catalogue</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}