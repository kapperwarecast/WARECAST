"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      // Sauvegarder la route de destination pour redirection après connexion
      const returnUrl = pathname !== '/auth/login' ? pathname : '/'
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`)
    }
  }, [user, loading, router, pathname])

  // Affichage pendant le chargement
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Vérification de votre session...</p>
        </div>
      </div>
    )
  }

  // Redirection en cours si pas d'utilisateur
  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p>Redirection vers la page de connexion...</p>
        </div>
      </div>
    )
  }

  // Utilisateur authentifié, afficher le contenu
  return <>{children}</>
}

// Hook personnalisé pour vérifier l'authentification dans les composants
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      const returnUrl = pathname !== '/auth/login' ? pathname : '/'
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`)
    }
  }, [user, loading, router, pathname])

  return { user, loading }
}