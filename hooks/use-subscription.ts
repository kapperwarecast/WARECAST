"use client"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import type { User } from "@supabase/supabase-js"
import { useSubscriptionFromStore, useSubscriptionStore } from "@/stores/subscription-store"

type Abonnement = Tables<"abonnements">
type UserAbonnement = Tables<"user_abonnements">

interface UserSubscriptionData extends UserAbonnement {
  abonnement: Abonnement
}

interface UseSubscriptionReturn {
  // État des abonnements disponibles
  availableSubscriptions: Abonnement[]
  loadingSubscriptions: boolean

  // État de l'abonnement utilisateur
  userSubscription: UserSubscriptionData | null
  loadingUserSubscription: boolean

  // Fonctions utilitaires
  hasActiveSubscription: boolean
  isSubscriptionExpired: boolean
  daysUntilExpiration: number | null

  // Actions
  subscribe: (abonnementId: string) => Promise<{ success: boolean; error?: string }>
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>

  // Refresh
  refreshUserSubscription: () => Promise<void>
}

export function useSubscription(user: User | null): UseSubscriptionReturn {
  const supabase = createClient()

  // Utiliser le store pour les données cachées
  const {
    userSubscription,
    availableSubscriptions,
    hasActiveSubscription,
    isSubscriptionExpired,
    daysUntilExpiration,
    loading,
  } = useSubscriptionFromStore()

  const { fetchData: fetchUserSubscription } = useSubscriptionStore()

  // Fonction pour souscrire à un abonnement
  const subscribe = async (abonnementId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Utilisateur non connecté" }
    }

    try {
      const selectedSubscription = availableSubscriptions.find(s => s.id === abonnementId)
      if (!selectedSubscription) {
        return { success: false, error: "Abonnement introuvable" }
      }

      // Calculer la date d'expiration
      const expirationDate = new Date()
      expirationDate.setMonth(expirationDate.getMonth() + selectedSubscription.duree_mois)

      const { error } = await supabase
        .from("user_abonnements")
        .insert([
          {
            user_id: user.id,
            abonnement_id: abonnementId,
            date_expiration: expirationDate.toISOString(),
            statut: "actif"
          }
        ])

      if (error) throw error

      // Actualiser l'abonnement utilisateur
      await fetchUserSubscription(user.id)

      return { success: true }
    } catch (error) {
      console.error("Erreur lors de la souscription:", error)
      return { success: false, error: "Erreur lors de la souscription" }
    }
  }

  // Fonction pour annuler un abonnement
  const cancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !userSubscription) {
      return { success: false, error: "Aucun abonnement actif" }
    }

    try {
      const { error } = await supabase
        .from("user_abonnements")
        .update({ statut: "suspendu" })
        .eq("id", userSubscription.id)

      if (error) throw error

      // Actualiser l'abonnement utilisateur
      await fetchUserSubscription(user.id)

      return { success: true }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error)
      return { success: false, error: "Erreur lors de l'annulation" }
    }
  }

  // Fonction pour actualiser l'abonnement utilisateur
  const refreshUserSubscription = async () => {
    await fetchUserSubscription(user?.id || null)
  }

  return {
    availableSubscriptions,
    loadingSubscriptions: false, // Handled by store
    userSubscription,
    loadingUserSubscription: loading,
    hasActiveSubscription,
    isSubscriptionExpired,
    daysUntilExpiration,
    subscribe,
    cancelSubscription,
    refreshUserSubscription
  }
}