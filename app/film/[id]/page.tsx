import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Calendar, User, Speech } from "lucide-react"
import type { Tables } from "@/lib/supabase/types"
import { MovieActionButtons } from "@/components/movie-action-buttons"
import { formatDuration } from "@/lib/utils/format"

type Movie = Tables<"movies">
type Actor = Tables<"actors">
type Director = Tables<"directors">
type MovieActor = Tables<"movie_actors">
type MovieDirector = Tables<"movie_directors">

interface MovieWithCast extends Movie {
  movie_directors: (MovieDirector & {
    directors: Director
  })[]
  movie_actors: (MovieActor & {
    actors: Actor
  })[]
}

interface Props {
  params: Promise<{
    id: string
  }>
}


async function getMovie(id: string): Promise<MovieWithCast | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("movies")
    .select(`
      *,
      movie_directors (
        id,
        job,
        directors (
          id,
          nom_complet,
          photo_path,
          tmdb_id
        )
      ),
      movie_actors (
        id,
        ordre_casting,
        role_personnage,
        actors (
          id,
          nom_complet,
          photo_path,
          tmdb_id
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching movie:", error)
    return null
  }

  return data as MovieWithCast
}

function getPosterUrl(path: string | null): string | null {
  if (!path) return null
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${path}`
  }
  
  return path
}

function getPersonPhotoUrl(path: string | null): string | null {
  if (!path) return null
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w185${path}`
  }
  
  return path
}

function DirectorCard({ director }: { director: Director }) {
  const photoUrl = getPersonPhotoUrl(director.photo_path)
  
  return (
    <Link href={`/personne/directeur/${director.id}`}>
      <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={director.nom_complet}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-zinc-500" />
          </div>
        )}
      </div>
      <div>
        <p className="font-medium text-white">{director.nom_complet}</p>
        <p className="text-sm text-zinc-400">Réalisateur</p>
      </div>
    </div>
    </Link>
  )
}

function ActorCard({ actor, role }: { actor: Actor; role: string | null }) {
  const photoUrl = getPersonPhotoUrl(actor.photo_path)
  
  return (
    <Link href={`/personne/acteur/${actor.id}`}>
      <div className="flex-shrink-0 w-32 hover:scale-105 transition-transform cursor-pointer">
      <div className="relative w-32 h-48 rounded-lg overflow-hidden bg-zinc-800 mb-2">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={actor.nom_complet}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-500" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-medium text-white text-sm line-clamp-2">{actor.nom_complet}</p>
        {role && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{role}</p>
        )}
      </div>
    </div>
    </Link>
  )
}

export default async function FilmPage({ params }: Props) {
  const { id } = await params
  const movie = await getMovie(id)

  if (!movie) {
    notFound()
  }

  const title = movie.titre_francais || movie.titre_original || "Sans titre"
  const originalTitle = movie.titre_original !== movie.titre_francais ? movie.titre_original : null
  const posterUrl = getPosterUrl(movie.poster_local_path)
  
  // Get directors
  const directors = movie.movie_directors?.map(md => md.directors) || []
  
  // Get actors sorted by casting order
  const actors = movie.movie_actors
    ?.sort((a, b) => (a.ordre_casting ?? 999) - (b.ordre_casting ?? 999))
    .slice(0, 12) // Limit to first 12 actors
    || []

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Back button */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-zinc-400 hover:text-white">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Poster */}
          <div className="flex-shrink-0 md:w-[350px] w-full">
            {/* Boutons d'action alignés à droite au-dessus de l'affiche */}
            <div className="flex justify-end mb-4">
              <MovieActionButtons
                movieId={movie.id}
                copiesDisponibles={movie.copies_disponibles}
              />
            </div>

            <Card className="overflow-hidden bg-zinc-900 border-zinc-800 py-0 md:mx-0 mx-auto w-full max-w-[350px] md:max-w-none">
              <div className="relative aspect-[2/3] w-full md:h-[525px]">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <div className="text-center p-8">
                      <p className="text-zinc-500 text-lg font-medium">{title}</p>
                      {movie.annee_sortie && (
                        <p className="text-zinc-600 text-sm mt-2">{movie.annee_sortie}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Movie Details */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              {originalTitle && (
                <p className="text-xl text-zinc-400">{originalTitle}</p>
              )}
            </div>

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {movie.annee_sortie && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.annee_sortie}</span>
                </div>
              )}
              {movie.duree && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(movie.duree)}</span>
                </div>
              )}
              {movie.langue_vo && (
                <div className="flex items-center gap-1">
                  <Speech className="w-4 h-4" />
                  <span>{movie.langue_vo}</span>
                </div>
              )}
            </div>

            {/* Directors */}
            {directors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  {directors.length === 1 ? 'Réalisé par' : 'Réalisé par'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {directors.map((director) => (
                    <DirectorCard key={director.id} director={director} />
                  ))}
                </div>
              </div>
            )}

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {movie.synopsis && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Synopsis</h3>
                <p className="text-zinc-300 leading-relaxed text-base">
                  {movie.synopsis}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cast - Full width */}
        {actors.length > 0 && (
          <div className="mt-12 space-y-4">
            <h3 className="text-lg font-semibold">Casting principal</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-2">
                {actors.map((movieActor) => (
                  <ActorCard 
                    key={movieActor.id} 
                    actor={movieActor.actors} 
                    role={movieActor.role_personnage} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}