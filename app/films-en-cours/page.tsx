'use client'

import { MovieGridRental } from '@/components/movie-grid-rental'
import { useCurrentRentals } from '@/hooks/data'
import { useInfiniteScroll } from '@/hooks/ui'
import { Clock } from 'lucide-react'

export default function FilmsEnCoursPage() {
  const {
    movies,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
  } = useCurrentRentals(20)

  // Hook pour l'infinite scroll automatique très proactif
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasNextPage: pagination?.hasNextPage ?? false,
    loading: loadingMore,
    rootMargin: '1000px',
    threshold: 0.1
  })
  if (error) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Films en cours</h1>
            <p className="text-zinc-400">Vos films actuellement empruntés</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Films en cours</h1>
          <p className="text-zinc-400">
            {pagination && !loading ? `${movies.length} film${movies.length > 1 ? 's' : ''} actuellement emprunté${movies.length > 1 ? 's' : ''}` : 'Vos films actuellement empruntés'}
          </p>
        </div>

        {/* Message si aucun film en cours */}
        {!loading && movies.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-4">
                <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              </div>
              <p className="text-zinc-400 text-lg mb-2">Aucun film en cours d&apos;emprunt</p>
              <p className="text-zinc-500 text-sm">
                Explorez notre catalogue pour emprunter de nouveaux films
              </p>
            </div>
          </div>
        )}


        {/* Grille de films - utilise exactement les mêmes composants que le catalogue */}
        {(movies.length > 0 || loading) && (
          <>
            <MovieGridRental movies={movies} loading={loading} />

            {/* Élément sentinel pour déclencher le chargement automatique */}
            {!loading && pagination && pagination.hasNextPage && (
              <div ref={sentinelRef} className="w-full py-8">
                {loadingMore && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Chargement de nouveaux films...</span>
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
                    ✓ Tous vos films en cours ont été chargés
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