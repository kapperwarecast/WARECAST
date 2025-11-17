"use client"

import { useOwnedFilms } from "@/hooks/data/use-owned-films"
import { Package, Loader2, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MovieGrid } from "@/components/movie-grid"
import Image from "next/image"

// Helper pour obtenir l'URL complète de l'affiche
const getPosterUrl = (path: string | null): string | null => {
  if (!path) return null

  // Si c'est déjà une URL complète (Supabase storage ou autre), utiliser directement
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Si c'est un chemin TMDB (commence par /), convertir en URL TMDB
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${path}`
  }

  return path
}

export default function MesFilmsPage() {
  const { films, loading, error } = useOwnedFilms()

  // Séparer le film en cours de lecture des autres
  const currentFilm = films.find(f => f.has_active_session)
  const availableFilms = films.filter(f => !f.has_active_session)

  if (loading && films.length === 0) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Chargement de votre collection...</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <Package className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h2 className="text-zinc-300 text-xl mb-3 font-semibold">
                Erreur de chargement
              </h2>
              <p className="text-zinc-500">{error}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Mes films</h1>
          </div>
          <p className="text-zinc-400">
            Votre collection personnelle de {films.length} film{films.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Film en cours de lecture - Section mise en avant */}
        {currentFilm && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-orange-500" />
              En cours de lecture
            </h2>
            <div className="bg-gradient-to-r from-orange-950/40 to-orange-900/20 border-2 border-orange-500/50 rounded-lg p-6">
              <div className="flex gap-6">
                {/* Affiche du film */}
                {currentFilm.movie.poster_local_path && (
                  <div className="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={getPosterUrl(currentFilm.movie.poster_local_path) || ''}
                      alt={currentFilm.movie.titre_francais || ''}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}

                {/* Contenu */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2">
                      {currentFilm.movie.titre_francais}
                    </h3>
                    {currentFilm.movie.titre_original &&
                     currentFilm.movie.titre_original !== currentFilm.movie.titre_francais && (
                      <p className="text-zinc-400 text-sm italic mb-3">
                        {currentFilm.movie.titre_original}
                      </p>
                    )}
                    <div className="flex gap-3 text-sm text-zinc-300 mb-4">
                      {currentFilm.movie.annee_sortie && (
                        <span>{currentFilm.movie.annee_sortie}</span>
                      )}
                      {currentFilm.movie.duree && (
                        <span>{currentFilm.movie.duree} min</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href={`/movie-player/${currentFilm.movie_id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Continuer la lecture
                      </Button>
                    </Link>
                    <Link href={`/film/${currentFilm.movie.slug}`}>
                      <Button variant="outline" className="border-zinc-700 hover:border-orange-500">
                        Voir les détails
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Films disponibles - Grille identique au catalogue */}
        {availableFilms.length === 0 && !currentFilm ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <Package className="w-20 h-20 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-zinc-300 text-xl mb-3 font-semibold">
                Aucun film dans votre collection
              </h2>
              <p className="text-zinc-500 mb-6">
                Échangez des films avec d&apos;autres collectionneurs pour agrandir votre collection.
              </p>
              <Link href="/">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Parcourir le catalogue
                </Button>
              </Link>
            </div>
          </div>
        ) : availableFilms.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Films disponibles {currentFilm ? `(${availableFilms.length})` : ''}
            </h2>

            {/* Grille de films avec MovieCard - identique au catalogue */}
            <MovieGrid
              movies={availableFilms.map(f => f.movie)}
              loading={loading}
            />
          </div>
        )}
      </div>
    </main>
  )
}
