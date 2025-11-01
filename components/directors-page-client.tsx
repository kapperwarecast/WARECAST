'use client'

import { DirectorGrid } from '@/components/director-grid'
import { FiltersModal } from '@/components/filters-modal'
import { useInfiniteDirectors } from '@/hooks/data/use-infinite-directors'
import { useInfiniteScroll } from '@/hooks/ui'
import { useFiltersModal } from '@/contexts/filters-context'
import { useEffect } from 'react'

export function DirectorsPageClient() {
  const { searchQuery, setSearchQuery, isFiltersModalOpen, setFiltersModalOpen } = useFiltersModal()

  const {
    directors,
    loading,
    loadingMore,
    error,
    pagination,
    filters,
    sort,
    loadMore,
    applyFilters,
    resetFilters,
  } = useInfiniteDirectors(20, searchQuery)

  // Clear search when component unmounts (user leaves directors page)
  useEffect(() => {
    return () => {
      setSearchQuery('')
    }
  }, [setSearchQuery])

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasNextPage: pagination?.hasNextPage ?? false,
    loading: loadingMore,
    rootMargin: '400px',
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
      {!loading && searchQuery && directors.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-zinc-400 text-lg mb-2">Aucun résultat pour &quot;{searchQuery}&quot;</p>
            <p className="text-zinc-500 text-sm">Essayez avec d&apos;autres mots-clés</p>
          </div>
        </div>
      )}

      {/* Grille de réalisateurs */}
      {(directors.length > 0 || loading) && (
        <DirectorGrid directors={directors} loading={loading} />
      )}

      {/* Élément sentinel pour déclencher le chargement automatique */}
      {!loading && pagination && pagination.hasNextPage && (
        <div ref={sentinelRef} className="w-full py-8">
          {loadingMore && (
            <div className="flex justify-center">
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Chargement de nouveaux réalisateurs...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicateur de progression */}
      {pagination && directors.length > 0 && (
        <div className="text-center mt-6 text-zinc-400 text-sm">
          {searchQuery ? (
            <>
              {directors.length} résultat{directors.length > 1 ? 's' : ''} trouvé{directors.length > 1 ? 's' : ''}
            </>
          ) : (
            <>
              {directors.length} réalisateurs sur {pagination.total}
              {!pagination.hasNextPage && directors.length > 20 && (
                <div className="mt-2 text-zinc-500">
                  ✓ Tous les réalisateurs ont été chargés
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
        pageType="directors"
      />
    </>
  )
}
