"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Loader2 } from "lucide-react"
import type { MovieImportResult } from "@/lib/tmdb/types"

interface ImportFormProps {
  onImportStart?: () => void
  onImportComplete?: (results: MovieImportResult[]) => void
}

export function ImportForm({ onImportStart, onImportComplete }: ImportFormProps) {
  const [tmdbIds, setTmdbIds] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tmdbIds.trim()) {
      setError("Veuillez saisir au moins un ID TMDB")
      return
    }

    setIsLoading(true)
    setError(null)
    onImportStart?.()

    try {
      // Parse IDs from textarea
      const ids = tmdbIds
        .split(/[,\n\s]+/)
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id > 0)

      if (ids.length === 0) {
        throw new Error("Aucun ID TMDB valide trouvé")
      }

      console.log("Starting import for IDs:", ids)

      const response = await fetch("/api/movies/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tmdbIds: ids })
      })

      if (!response.ok) {
        let errorMessage = "Erreur lors de l'import"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Response is not JSON, use status text
          errorMessage = `Erreur ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (e) {
        throw new Error("Réponse invalide du serveur")
      }
      
      console.log("Import completed:", data)

      onImportComplete?.(data.results)
      setTmdbIds("") // Clear form on success
    } catch (error) {
      console.error("Import error:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="h-5 w-5" />
          Importer des films depuis TMDB
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Saisissez les IDs TMDB des films à importer, séparés par des virgules ou des retours à la ligne
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="tmdbIds" className="text-zinc-300">
              IDs TMDB
            </Label>
            <Textarea
              id="tmdbIds"
              value={tmdbIds}
              onChange={(e) => setTmdbIds(e.target.value)}
              placeholder="550, 13, 27205&#10;ou un ID par ligne..."
              rows={6}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 font-mono"
              disabled={isLoading}
            />
            <p className="text-zinc-500 text-xs">
              Exemple: 550 (Fight Club), 13 (Forrest Gump), 27205 (Inception)
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !tmdbIds.trim()}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importer les films
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}