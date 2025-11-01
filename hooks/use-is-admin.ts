'use client'

import { useAuth } from '@/contexts/auth-context'

/**
 * Hook pour vérifier si l'utilisateur connecté est un administrateur
 *
 * @returns {boolean} true si l'utilisateur est admin, false sinon
 *
 * @example
 * ```tsx
 * function AdminButton() {
 *   const isAdmin = useIsAdmin()
 *
 *   if (!isAdmin) return null
 *
 *   return <button>Admin Panel</button>
 * }
 * ```
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}
