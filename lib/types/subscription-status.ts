/**
 * Types et utilitaires pour la gestion des statuts d'abonnement
 */

export type SubscriptionStatus = 'actif' | 'résilié' | 'suspendu' | 'expiré'

/**
 * Statuts qui donnent accès aux emprunts illimités
 */
export const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['actif', 'résilié']

/**
 * Vérifie si un abonnement est valide (donne accès aux emprunts illimités)
 * Un abonnement est valide si :
 * - Le statut est 'actif' ou 'résilié' (résiliation programmée)
 * - La date d'expiration n'est pas dépassée
 */
export function isSubscriptionValid(
  statut: string,
  dateExpiration: string | Date
): boolean {
  const isValidStatus = VALID_SUBSCRIPTION_STATUSES.includes(statut as SubscriptionStatus)
  const isNotExpired = new Date(dateExpiration) > new Date()

  return isValidStatus && isNotExpired
}

/**
 * Vérifie si un abonnement est programmé pour résiliation
 * (l'utilisateur a résilié mais garde l'accès jusqu'à expiration)
 */
export function isScheduledForCancellation(statut: string): boolean {
  return statut === 'résilié'
}

/**
 * Retourne un message descriptif du statut de l'abonnement
 */
export function getSubscriptionStatusMessage(
  statut: string,
  dateExpiration: string | Date
): string {
  const expirationDate = new Date(dateExpiration)
  const formattedDate = expirationDate.toLocaleDateString('fr-FR')

  switch (statut) {
    case 'actif':
      return `Abonnement actif jusqu'au ${formattedDate}`
    case 'résilié':
      return `Résiliation confirmée. Aucun prélèvement ne sera effectué à partir de la fin de votre période en cours. Vous conservez l'accès à tous vos avantages jusqu'au ${formattedDate}.`
    case 'suspendu':
      return 'Abonnement suspendu'
    case 'expiré':
      return `Abonnement expiré le ${formattedDate}`
    default:
      return 'Statut inconnu'
  }
}

/**
 * Calcule le nombre de jours restants avant expiration
 */
export function getDaysUntilExpiration(dateExpiration: string | Date): number {
  const now = new Date()
  const expiration = new Date(dateExpiration)
  const diffTime = expiration.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}
