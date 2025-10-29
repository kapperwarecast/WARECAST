'use client'

import { DirectorGrid } from '@/components/director-grid'
import { useInfiniteDirectors } from '@/hooks/data/use-infinite-directors'
import { useInfiniteScroll } from '@/hooks/ui'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useCallback } from 'react'
import { debounce } from '@/lib/utils/debounce'

export function DirectorsPageClient() {
  const {
    directors,
    loading,
    loadingMore,
    error,
    pagination,
    searchQuery,
    setSearchQuery,
    loadMore,
  } = useInfiniteDirectors(20)

  const [inputValue, setInputValue] = useState('')

  // Debounced search
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
    }, 500),
    [setSearchQuery]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    debouncedSetSearch(value)
  }

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
      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Rechercher un réalisateur..."
            value={inputValue}
            onChange={handleSearchChange}
            className="pl-9 bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
          title="Filtres et tri (à venir)"
          disabled
        >
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
        </Button>
      </div>

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
    </>
  )
}
