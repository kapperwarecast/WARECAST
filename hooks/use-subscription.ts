"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"
import type { User } from "@supabase/supabase-js"

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
  const [availableSubscriptions, setAvailableSubscriptions] = useState<Abonnement[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)
  
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionData | null>(null)
  const [loadingUserSubscription, setLoadingUserSubscription] = useState(true)

  const supabase = createClient()

  // Charger les abonnements disponibles
  useEffect(() => {
    const fetchAvailableSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from("abonnements")
          .select("*")
          .order("prix", { ascending: true })
        
        if (error) throw error
        setAvailableSubscriptions(data || [])
      } catch (error) {
        console.error("Erreur lors du chargement des abonnements:", error)
        setAvailableSubscriptions([])
      } finally {
        setLoadingSubscriptions(false)
      }
    }

    fetchAvailableSubscriptions()
  }, [supabase])

  // Charger l'abonnement de l'utilisateur
  const fetchUserSubscription = async () => {
    if (!user) {
      setUserSubscription(null)
      setLoadingUserSubscription(false)
      return
    }

    try {
      setLoadingUserSubscription(true)
      
      const { data, error } = await supabase
        .from("user_abonnements")
        .select(`
          *,
          abonnement:abonnements(*)
        `)
        .eq("user_id", user.id)
        .eq("statut", "actif")
        .order("date_expiration", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        throw error
      }

      setUserSubscription(data || null)
    } catch (error) {
      console.error("Erreur lors du chargement de l'abonnement utilisateur:", error)
      setUserSubscription(null)
    } finally {
      setLoadingUserSubscription(false)
    }
  }

  useEffect(() => {
    fetchUserSubscription()
  }, [user, supabase])

  // Calculer les propriétés dérivées
  const hasActiveSubscription = Boolean(
    userSubscription && 
    userSubscription.statut === "actif" && 
    new Date(userSubscription.date_expiration) > new Date()
  )

  const isSubscriptionExpired = Boolean(
    userSubscription && 
    new Date(userSubscription.date_expiration) <= new Date()
  )

  const daysUntilExpiration = userSubscription 
    ? Math.ceil((new Date(userSubscription.date_expiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

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
      await fetchUserSubscription()
      
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
      await fetchUserSubscription()
      
      return { success: true }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error)
      return { success: false, error: "Erreur lors de l'annulation" }
    }
  }

  // Fonction pour actualiser l'abonnement utilisateur
  const refreshUserSubscription = async () => {
    await fetchUserSubscription()
  }

  return {
    availableSubscriptions,
    loadingSubscriptions,
    userSubscription,
    loadingUserSubscription,
    hasActiveSubscription,
    isSubscriptionExpired,
    daysUntilExpiration,
    subscribe,
    cancelSubscription,
    refreshUserSubscription
  }
}