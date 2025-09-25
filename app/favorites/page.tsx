'use client'

import { MovieGrid } from '@/components/movie-grid'
import { useFavoriteMovies } from '@/hooks/useFavoriteMovies'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const {
    movies,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
  } = useFavoriteMovies(20)

  // Hook pour l'infinite scroll automatique très proactif
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasNextPage: pagination?.hasNextPage ?? false,
    loading: loadingMore,
    rootMargin: '1000px', // Commencer à charger 1000px avant d'atteindre le bas pour un chargement ultra-fluide
    threshold: 0.1
  })

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Afficher un loading pendant la vérification d'authentification
  if (authLoading) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement...</span>
          </div>
        </div>
      </main>
    )
  }

  // Ne pas afficher la page si non authentifié
  if (!user) {
    return null
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Mes favoris</h1>
            <p className="text-zinc-400">Les films que vous avez aimés</p>
          </div>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-2">Erreur de chargement</p>
              <p className="text-zinc-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mes favoris</h1>
          <p className="text-zinc-400">
            {pagination && !loading ? `${movies.length} film${movies.length > 1 ? 's' : ''} dans vos favoris` : 'Les films que vous avez aimés'}
          </p>
        </div>

        {/* Message si aucun favori */}
        {!loading && movies.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-zinc-600 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <p className="text-zinc-400 text-lg mb-2">Aucun film dans vos favoris</p>
              <p className="text-zinc-500 text-sm">
                Explorez notre catalogue et cliquez sur ♥ pour ajouter des films à vos favoris
              </p>
            </div>
          </div>
        )}

        {/* Grille de films - utilise exactement les mêmes composants que le catalogue */}
        {(movies.length > 0 || loading) && (
          <>
            <MovieGrid movies={movies} loading={loading} />

            {/* Élément sentinel pour déclencher le chargement automatique */}
            {!loading && pagination && pagination.hasNextPage && (
              <div ref={sentinelRef} className="w-full py-8">
                {loadingMore && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Chargement de nouveaux favoris...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Indicateur de progression */}
            {pagination && (
              <div className="text-center mt-6 text-zinc-400 text-sm">
                {movies.length} film{movies.length > 1 ? 's' : ''} sur {pagination.total}
                {!pagination.hasNextPage && movies.length > 20 && (
                  <div className="mt-2 text-zinc-500">
                    ✓ Tous vos favoris ont été chargés
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}