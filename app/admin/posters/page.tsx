'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, CheckCircle, XCircle, Image } from 'lucide-react'

interface ImportResult {
  tmdbId: number
  fileName: string
  success: boolean
  action: 'uploaded' | 'skipped' | 'error'
  publicUrl?: string
  movieTitle?: string
  error?: string
}

interface ImportResponse {
  success: boolean
  message?: string
  totalFound: number
  totalUploaded: number
  totalUpdated: number
  totalSkipped: number
  results: ImportResult[]
  error?: string
}

export default function PostersImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)

  const handleImportPosters = async () => {
    setIsImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/posters/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }

      setImportResult(data)
    } catch (error) {
      console.error('Erreur import affiches:', error)
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        totalFound: 0,
        totalUploaded: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        results: []
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import des Affiches Personnalisées</h1>
        <p className="text-muted-foreground">
          Importer et associer les affiches personnalisées du dossier &quot;affiches&quot; aux films de la base de données.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Import des Affiches
          </CardTitle>
          <CardDescription>
            Cette action va scanner le dossier &quot;affiches&quot;, uploader les images dans le bucket &quot;posters&quot; 
            et associer automatiquement les affiches aux films correspondants selon leur ID TMDB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleImportPosters} 
            disabled={isImporting}
            className="w-full md:w-auto"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importer les Affiches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Résultat de l&apos;Import
            </CardTitle>
            <CardDescription>
              {importResult.success 
                ? `Import terminé avec succès - ${importResult.totalUploaded} affiches uploadées, ${importResult.totalSkipped || 0} ignorées, ${importResult.totalUpdated} films mis à jour`
                : `Erreur lors de l&apos;import: ${importResult.error}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importResult.success && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {importResult.totalFound}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Affiches trouvées
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {importResult.totalUploaded}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Affiches uploadées
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {importResult.totalSkipped || 0}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    Affiches ignorées
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {importResult.totalUpdated}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Films mis à jour
                  </div>
                </div>
              </div>
            )}

            {importResult.results && importResult.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold mb-4">Détails par affiche:</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {importResult.results.map((result, index) => (
                    <div 
                      key={`${result.tmdbId}-${result.fileName}-${index}`} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{result.fileName}</span>
                          <Badge variant="outline">TMDB {result.tmdbId}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.movieTitle}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-500 mt-1">
                            {result.error}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.action === 'uploaded' ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Uploadé
                          </Badge>
                        ) : result.action === 'skipped' ? (
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ignoré
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Échec
                          </Badge>
                        )}
                        {result.publicUrl && (
                          <a 
                            href={result.publicUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            Voir
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}