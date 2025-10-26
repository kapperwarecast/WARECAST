/**
 * Utilitaires pour la gestion des abonnements
 */

import type { Tables } from "@/lib/supabase/types"
import {
  isSubscriptionValid,
  isScheduledForCancellation,
  getSubscriptionStatusMessage,
  getDaysUntilExpiration,
  type SubscriptionStatus
} from "@/lib/types/subscription-status"

type UserAbonnement = Tables<"user_abonnements">
type Abonnement = Tables<"abonnements">

export interface UserSubscriptionData extends UserAbonnement {
  abonnement?: Abonnement
}

/**
 * Vérifie si un utilisateur peut accéder aux emprunts illimités
 */
export function canAccessUnlimitedRentals(
  subscription: UserSubscriptionData | null
): boolean {
  if (!subscription) return false

  return isSubscriptionValid(subscription.statut, subscription.date_expiration)
}

/**
 * Retourne un statut d'affichage user-friendly
 */
export function getSubscriptionDisplayStatus(
  subscription: UserSubscriptionData | null
): {
  status: SubscriptionStatus | null
  message: string
  isActive: boolean
  isScheduledForCancellation: boolean
  daysRemaining: number | null
  canCancel: boolean
  canReactivate: boolean
} {
  if (!subscription) {
    return {
      status: null,
      message: 'Aucun abonnement',
      isActive: false,
      isScheduledForCancellation: false,
      daysRemaining: null,
      canCancel: false,
      canReactivate: false
    }
  }

  const status = subscription.statut as SubscriptionStatus
  const isActive = isSubscriptionValid(status, subscription.date_expiration)
  const isScheduled = isScheduledForCancellation(status)
  const daysRemaining = getDaysUntilExpiration(subscription.date_expiration)
  const message = getSubscriptionStatusMessage(status, subscription.date_expiration)

  return {
    status,
    message,
    isActive,
    isScheduledForCancellation: isScheduled,
    daysRemaining,
    canCancel: status === 'actif' && isActive,
    canReactivate: status === 'résilié' && isActive
  }
}

/**
 * Formate la date d'expiration pour l'affichage
 */
export function formatExpirationDate(dateExpiration: string | Date): string {
  return new Date(dateExpiration).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Retourne un badge de couleur selon le statut
 */
export function getSubscriptionBadgeColor(status: SubscriptionStatus | null): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'actif':
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        border: 'border-green-500'
      }
    case 'résilié':
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-500'
      }
    case 'suspendu':
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-500'
      }
    case 'expiré':
      return {
        bg: 'bg-zinc-500',
        text: 'text-white',
        border: 'border-zinc-500'
      }
    default:
      return {
        bg: 'bg-zinc-700',
        text: 'text-zinc-300',
        border: 'border-zinc-700'
      }
  }
}

/**
 * Retourne un label user-friendly pour le statut
 */
export function getSubscriptionStatusLabel(status: SubscriptionStatus | null): string {
  switch (status) {
    case 'actif':
      return 'Abonnement actif'
    case 'résilié':
      return 'Résiliation programmée'
    case 'suspendu':
      return 'Abonnement suspendu'
    case 'expiré':
      return 'Abonnement expiré'
    default:
      return 'Statut inconnu'
  }
}
