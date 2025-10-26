import type { Tables } from "@/lib/supabase/types"

export type Abonnement = Tables<"abonnements">
export type UserAbonnement = Tables<"user_abonnements">

/**
 * Données complètes d'un abonnement utilisateur avec les détails de l'abonnement
 */
export interface UserSubscriptionData extends UserAbonnement {
  abonnement: Abonnement
}

/**
 * Retour du hook useSubscription
 */
export interface UseSubscriptionReturn {
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
