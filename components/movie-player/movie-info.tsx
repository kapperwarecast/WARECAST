import { Clock, Calendar, Film, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { MovieInfoProps } from "@/types/player"
import { getDirectorName } from "@/types/movie"
import { formatDuration, getLanguageName } from "@/lib/utils/format"

export function MovieInfo({ movie, className }: MovieInfoProps) {
  const director = getDirectorName(movie)
  const duration = formatDuration(movie.duree)
  const language = movie.langue_vo

  return (
    <div className={cn("space-y-6", className)}>
      {/* Title Section */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          {movie.titre_francais || "Sans titre"}
        </h1>

        {movie.titre_original && movie.titre_original !== movie.titre_francais && (
          <p className="text-xl text-zinc-300 italic">
            {movie.titre_original}
          </p>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        {movie.annee_sortie && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{movie.annee_sortie}</span>
          </div>
        )}

        {duration && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        )}

        {director && (
          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4" />
            <span>{director}</span>
          </div>
        )}

        {language && (
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4" />
            <span>{getLanguageName(language)}</span>
          </div>
        )}
      </div>

      {/* Genres */}
      {movie.genres && movie.genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {movie.genres.map((genre, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>
      )}

      {/* Synopsis */}
      {movie.synopsis && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Synopsis</h2>
          <p className="text-zinc-300 leading-relaxed">
            {movie.synopsis}
          </p>
        </div>
      )}

      {/* Status and Rating */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
        {movie.statut && (
          <div className="text-sm">
            <span className="text-zinc-400">Statut : </span>
            <span className={cn(
              "font-medium",
              movie.statut === "en ligne"
                ? "text-green-400"
                : "text-yellow-400"
            )}>
              {movie.statut === "en ligne" ? "En ligne" : "En traitement"}
            </span>
          </div>
        )}

        {movie.note_tmdb && (
          <div className="text-sm">
            <span className="text-zinc-400">Note TMDB : </span>
            <span className="font-medium text-white">
              {parseFloat(movie.note_tmdb.toString()).toFixed(1)}/10
            </span>
          </div>
        )}
      </div>
    </div>
  )
}