"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Film } from "lucide-react"
import type { MovieImportResult } from "@/lib/tmdb/types"

interface ImportProgressProps {
  results: MovieImportResult[]
  isLoading?: boolean
}

export function ImportProgress({ results, isLoading }: ImportProgressProps) {
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const total = results.length

  if (total === 0 && !isLoading) {
    return null
  }

  return (
    <Card className="w-full bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Film className="h-5 w-5" />
          Résultats de l'import
          {isLoading && <Clock className="h-4 w-4 animate-pulse text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex gap-4 text-sm">
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
            {successful} réussis
          </Badge>
          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">
            {failed} échoués
          </Badge>
          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
            {total} total
          </Badge>
        </div>

        {/* Results list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.tmdbId}
              className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700"
            >
              {/* Status icon */}
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {result.title || `TMDB ID: ${result.tmdbId}`}
                  </span>
                  <Badge variant="outline" className="text-xs bg-zinc-700 text-zinc-300 border-zinc-600">
                    {result.tmdbId}
                  </Badge>
                </div>

                {result.success && (
                  <p className="text-zinc-400 text-sm">
                    {result.actorsImported} acteurs, {result.directorsImported} réalisateurs
                  </p>
                )}

                {result.error && (
                  <p className="text-red-400 text-sm">{result.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-zinc-400 py-4">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Import en cours...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}