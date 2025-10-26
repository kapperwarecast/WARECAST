import { usePathname } from "next/navigation"

/**
 * Hook pour détecter si une route est active
 * Centralise la logique de comparaison des routes
 */
export function useActiveRoute() {
  const pathname = usePathname()

  const isRouteActive = (href: string, exact = true): boolean => {
    if (exact) {
      return pathname === href
    }
    // Pour les routes comme /admin qui peuvent avoir des sous-routes
    return pathname.startsWith(href)
  }

  const isAnyRouteActive = (routes: string[]): boolean => {
    return routes.some(route => isRouteActive(route))
  }

  return {
    pathname,
    isRouteActive,
    isAnyRouteActive,
    // Helpers pour les routes spécifiques couramment utilisées
    isHome: pathname === '/',
    isProfile: pathname === '/profile',
    isAdmin: pathname.startsWith('/admin'),
    isAuth: pathname.startsWith('/auth'),
    isHelp: pathname === '/help'
  }
}