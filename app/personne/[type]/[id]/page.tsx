import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User } from "lucide-react"
import { MovieCard } from "@/components/movie-card"
import type { Tables } from "@/lib/supabase/types"

type Actor = Tables<"actors">
type Director = Tables<"directors">
type Movie = Tables<"movies">
type MovieActor = Tables<"movie_actors">
type MovieDirector = Tables<"movie_directors">

interface ActorWithMovies extends Actor {
  movie_actors: (MovieActor & {
    movies: Movie
  })[]
}

interface DirectorWithMovies extends Director {
  movie_directors: (MovieDirector & {
    movies: Movie
  })[]
}

interface Props {
  params: Promise<{
    type: 'acteur' | 'directeur'
    id: string
  }>
}

async function getActor(id: string): Promise<ActorWithMovies | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("actors")
    .select(`
      *,
      movie_actors (
        id,
        ordre_casting,
        role_personnage,
        movies (*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching actor:", error)
    return null
  }

  return data as ActorWithMovies
}

async function getDirector(id: string): Promise<DirectorWithMovies | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("directors")
    .select(`
      *,
      movie_directors (
        id,
        job,
        movies (*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching director:", error)
    return null
  }

  return data as DirectorWithMovies
}

function getPersonPhotoUrl(path: string | null): string | null {
  if (!path) return null
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w300${path}`
  }
  
  return path
}

export default async function PersonnePage({ params }: Props) {
  const { type, id } = await params
  
  if (type !== 'acteur' && type !== 'directeur') {
    notFound()
  }

  const person = type === 'acteur' ? await getActor(id) : await getDirector(id)

  if (!person) {
    notFound()
  }

  const photoUrl = getPersonPhotoUrl(person.photo_path)
  
  // Get movies
  const movies = type === 'acteur' 
    ? (person as ActorWithMovies).movie_actors
        ?.map(ma => ma.movies)
        .sort((a, b) => (b.annee_sortie || 0) - (a.annee_sortie || 0)) || []
    : (person as DirectorWithMovies).movie_directors
        ?.map(md => md.movies)
        .sort((a, b) => (b.annee_sortie || 0) - (a.annee_sortie || 0)) || []

  const typeLabel = type === 'acteur' ? 'Acteur' : 'Réalisateur'
  const filmCountLabel = movies.length === 1 ? 'film' : 'films'

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

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Photo */}
          <div className="flex-shrink-0 lg:w-[300px] w-full">
            <Card className="overflow-hidden bg-zinc-900 border-zinc-800 py-0 lg:mx-0 mx-auto w-full max-w-[300px]">
              <div className="relative aspect-[2/3] w-full lg:h-[450px]">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={person.nom_complet}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <div className="text-center p-8">
                      <User className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                      <p className="text-zinc-500 text-lg font-medium">{person.nom_complet}</p>
                      <p className="text-zinc-600 text-sm mt-2">{typeLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Person Details */}
          <div className="flex-1 space-y-6">
            {/* Name */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{person.nom_complet}</h1>
              <p className="text-xl text-zinc-400">{typeLabel}</p>
            </div>

            {/* Bio information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Informations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {person.prenom && (
                  <div>
                    <span className="text-zinc-400">Prénom: </span>
                    <span>{person.prenom}</span>
                  </div>
                )}
                {person.nom && (
                  <div>
                    <span className="text-zinc-400">Nom: </span>
                    <span>{person.nom}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400">ID TMDB: </span>
                  <span>{person.tmdb_id || 'Non disponible'}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Nombre de {filmCountLabel}: </span>
                  <span>{movies.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filmography */}
        {movies.length > 0 && (
          <div className="mt-12 space-y-6">
            <h3 className="text-2xl font-semibold">
              {type === 'acteur' ? 'Filmographie' : 'Films réalisés'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}

        {/* No movies */}
        {movies.length === 0 && (
          <div className="mt-12 text-center py-12">
            <p className="text-zinc-400 text-lg">
              Aucun film trouvé pour {person.nom_complet}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}