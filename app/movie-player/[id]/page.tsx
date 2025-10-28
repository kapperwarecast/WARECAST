import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { MoviePlayerClient } from "@/components/movie-player/movie-player-client"
import { MovieInfo } from "@/components/movie-player/movie-info"
import { MovieAccessGuard } from "@/components/movie-player/movie-access-guard"
import type { MovieWithPlayer } from "@/types/player"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMovie(id: string): Promise<MovieWithPlayer | null> {
  const supabase = await createClient()

  try {
    const { data: movie, error } = await supabase
      .from("movies")
      .select(`
        *,
        movie_directors (
          directors (
            nom_complet
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching movie:", error)
      return null
    }

    return movie
  } catch (error) {
    console.error("Error fetching movie:", error)
    return null
  }
}

export default async function MoviePlayerPage({ params }: PageProps) {
  const { id } = await params
  const movie = await getMovie(id)

  if (!movie) {
    notFound()
  }

  const title = movie.titre_francais || movie.titre_original || "Film sans titre"

  return (
    <MovieAccessGuard movieId={id}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              </Link>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-white truncate">
                  {title}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Video Player Section */}
            <div className="w-full">
              {/* Le MoviePlayerClient va récupérer le rental ID lui-même */}
              <MoviePlayerClient
                movieId={id}
                vimeoUrl={movie.lien_vimeo}
                title={title}
              />
            </div>

            {/* Movie Information Section */}
            <div className="w-full">
              <MovieInfo
                movie={movie}
                className="max-w-4xl"
              />
            </div>
          </div>
        </main>
      </div>
    </MovieAccessGuard>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const movie = await getMovie(id)

  if (!movie) {
    return {
      title: "Film non trouvé - Warecast",
      description: "Ce film n'existe pas ou n'est plus disponible.",
    }
  }

  const title = movie.titre_francais || movie.titre_original || "Film sans titre"

  return {
    title: `${title} - Warecast`,
    description: movie.synopsis || `Regarder ${title} en streaming sur Warecast`,
  }
}
