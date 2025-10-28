'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMovieAccess } from '@/hooks/data'

interface MovieAccessGuardProps {
  movieId: string
  children: React.ReactNode
}

export function MovieAccessGuard({ movieId, children }: MovieAccessGuardProps) {
  const router = useRouter()
  const { status, shouldRedirect, error } = useMovieAccess(movieId)

  // Redirection silencieuse quand nécessaire
  useEffect(() => {
    if (status === 'redirect' && shouldRedirect) {
      router.push(shouldRedirect)
    }
  }, [status, shouldRedirect, router])

  // État de chargement simple
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
          <p className="text-white text-lg">Vérification de l&apos;accès...</p>
        </div>
      </div>
    )
  }

  // Redirection en cours - affichage minimal
  if (status === 'redirect') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Accès accordé - afficher le contenu
  if (status === 'granted') {
    return <>{children}</>
  }

  // État par défaut (ne devrait pas arriver)
  return null
}
