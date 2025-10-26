'use client'

import { MovieGrid } from '@/components/movie-grid'
import { FiltersModal } from '@/components/filters-modal'
import { useInfiniteMovies, useInfiniteScroll } from '@/hooks/ui'
import { useFiltersModal } from '@/contexts/filters-context'

export function MoviesPageClient() {
  const { isFiltersModalOpen, setFiltersModalOpen, searchQuery } = useFiltersModal()

  const {
    movies,
    loading,
    loadingMore,
    error,
    pagination,
    filters,
    sort,
    loadMore,
    applyFilters,
    resetFilters,
  } = useInfiniteMovies(20)

  // OPTIMIZATION: Réduire rootMargin pour éviter préchargement excessif (-60% données inutiles)
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasNextPage: pagination?.hasNextPage ?? false,
    loading: loadingMore,
    rootMargin: '400px', // 2-3 scrolls d'avance suffisent (au lieu de 1000px)
    threshold: 0.1
  })

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Erreur de chargement</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Message si aucun résultat pour la recherche */}
      {!loading && searchQuery && movies.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-zinc-400 text-lg mb-2">Aucun résultat pour &quot;{searchQuery}&quot;</p>
            <p className="text-zinc-500 text-sm">Essayez avec d&apos;autres mots-clés</p>
          </div>
        </div>
      )}

      {/* Grille de films */}
      {(movies.length > 0 || loading) && (
        <MovieGrid movies={movies} loading={loading} />
      )}

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
      {pagination && movies.length > 0 && (
        <div className="text-center mt-6 text-zinc-400 text-sm">
          {searchQuery ? (
            <>
              {movies.length} résultat{movies.length > 1 ? 's' : ''} trouvé{movies.length > 1 ? 's' : ''}
            </>
          ) : (
            <>
              {movies.length} films sur {pagination.total}
              {!pagination.hasNextPage && movies.length > 20 && (
                <div className="mt-2 text-zinc-500">
                  ✓ Tous les films ont été chargés
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de filtres */}
      <FiltersModal
        open={isFiltersModalOpen}
        onOpenChange={setFiltersModalOpen}
        filters={filters}
        sort={sort}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />
    </>
  )
}
