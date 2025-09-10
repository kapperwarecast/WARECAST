import { createClient } from '@/lib/supabase/server'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Tables } from '@/lib/supabase/types'

type Movie = Tables<"movies">

interface PosterFile {
  fileName: string
  tmdbId: number
  title: string
  fullPath: string
}

interface UploadPosterResponse {
  success: boolean
  publicUrl?: string
  error?: string
  tmdbId?: number
}

interface PosterImportResult {
  success: boolean
  totalFound: number
  totalUploaded: number
  totalUpdated: number
  totalSkipped: number
  results: Array<{
    tmdbId: number
    fileName: string
    success: boolean
    action: 'uploaded' | 'skipped' | 'error'
    publicUrl?: string
    movieTitle?: string
    error?: string
  }>
}

export class PosterImportService {
  private async getSupabase() {
    return await createClient()
  }

  private getSupabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
    }
    return url
  }

  private getSupabaseAnonKey(): string {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
    }
    return key
  }

  /**
   * Scanne le dossier affiches et extrait les informations des noms de fichiers
   */
  private scanPosterFiles(affichesPath: string): PosterFile[] {
    try {
      const files = readdirSync(affichesPath)
      const posterFiles: PosterFile[] = []

      for (const fileName of files) {
        // Matcher le pattern: "123 - titre du film_DxO.jpg"
        const match = fileName.match(/^(\d+)\s*-\s*(.+?)(?:_DxO)?\.(jpe?g|png|webp)$/i)
        
        if (match) {
          const tmdbId = parseInt(match[1])
          const title = match[2].trim()
          const fullPath = join(affichesPath, fileName)
          
          posterFiles.push({
            fileName,
            tmdbId,
            title,
            fullPath
          })
        } else {
          console.warn(`📁 Fichier ignoré (format non reconnu): ${fileName}`)
        }
      }

      console.log(`📁 ${posterFiles.length} affiches trouvées dans ${affichesPath}`)
      return posterFiles

    } catch (error) {
      console.error(`📁 Erreur lors du scan du dossier ${affichesPath}:`, error)
      return []
    }
  }

  /**
   * Vérifie si une affiche existe déjà dans le bucket
   */
  private async checkPosterExists(publicUrl: string): Promise<boolean> {
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.warn(`🔍 Erreur vérification existence affiche ${publicUrl}:`, error)
      return false
    }
  }

  /**
   * Upload une affiche via l'Edge Function
   */
  private async uploadPoster(posterFile: PosterFile): Promise<UploadPosterResponse> {
    try {
      console.log(`🚀 Upload de l'affiche ${posterFile.fileName} (TMDB ID: ${posterFile.tmdbId})`)
      
      // Lire le fichier et le convertir en base64
      const imageBuffer = readFileSync(posterFile.fullPath)
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
      
      const supabaseUrl = this.getSupabaseUrl()
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-poster`
      
      const requestBody = {
        imageData: base64Image,
        fileName: posterFile.fileName,
        tmdbId: posterFile.tmdbId
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getSupabaseAnonKey()}`,
          'apikey': this.getSupabaseAnonKey()
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`🚀 Edge Function HTTP error ${response.status}:`, errorText)
        throw new Error(`Edge Function request failed: ${response.status} ${response.statusText}`)
      }

      const result: UploadPosterResponse = await response.json()
      
      if (!result.success) {
        console.error(`🚀 Edge Function returned error:`, result.error)
        throw new Error(`Upload failed: ${result.error}`)
      }

      console.log(`✅ Affiche uploadée avec succès: ${result.publicUrl}`)
      return result

    } catch (error) {
      console.error(`💥 Erreur upload affiche ${posterFile.fileName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tmdbId: posterFile.tmdbId
      }
    }
  }

  /**
   * Met à jour le poster_local_path d'un film
   */
  private async updateMoviePoster(tmdbId: number, publicUrl: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('movies')
        .update({ poster_local_path: publicUrl })
        .eq('tmdb_id', tmdbId)

      if (error) {
        console.error(`💾 Erreur mise à jour film ${tmdbId}:`, error)
        return false
      }

      console.log(`✅ Film ${tmdbId} mis à jour avec nouveau poster`)
      return true

    } catch (error) {
      console.error(`💾 Erreur critique mise à jour film ${tmdbId}:`, error)
      return false
    }
  }

  /**
   * Import complet des affiches personnalisées
   */
  async importCustomPosters(
    affichesPath: string = 'C:\\\\Users\\\\adkapper\\\\Desktop\\\\CC\\\\Warecast\\\\affiches', 
    options: { force?: boolean } = {}
  ): Promise<PosterImportResult> {
    try {
      console.log(`🎬 Début de l'import des affiches personnalisées depuis ${affichesPath}`)
      
      // Scanner le dossier affiches
      const posterFiles = this.scanPosterFiles(affichesPath)
      if (posterFiles.length === 0) {
        return {
          success: true,
          totalFound: 0,
          totalUploaded: 0,
          totalUpdated: 0,
          totalSkipped: 0,
          results: []
        }
      }

      // Récupérer la liste des films en base
      const supabase = await this.getSupabase()
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('tmdb_id, titre_francais, titre_original, poster_local_path')

      if (moviesError) {
        throw new Error(`Erreur récupération films: ${moviesError.message}`)
      }

      const moviesByTmdbId = new Map<number, Movie>()
      movies?.forEach(movie => {
        moviesByTmdbId.set(movie.tmdb_id, movie)
      })

      console.log(`🎬 ${movies?.length} films trouvés en base`)

      // Process chaque affiche
      const results = []
      let totalUploaded = 0
      let totalUpdated = 0
      let totalSkipped = 0

      for (const posterFile of posterFiles) {
        const movie = moviesByTmdbId.get(posterFile.tmdbId)
        const movieTitle = movie?.titre_francais || movie?.titre_original || 'Film non trouvé'

        console.log(`\\n📸 Traitement: ${posterFile.fileName} → Film: ${movieTitle}`)

        // Vérifier si l'affiche existe déjà (sauf si force=true)
        let shouldSkip = false
        if (!options.force && movie?.poster_local_path) {
          const exists = await this.checkPosterExists(movie.poster_local_path)
          if (exists) {
            console.log(`⏭️  Affiche déjà présente, ignorée: ${movie.poster_local_path}`)
            shouldSkip = true
            totalSkipped++
            
            results.push({
              tmdbId: posterFile.tmdbId,
              fileName: posterFile.fileName,
              success: true,
              action: 'skipped',
              publicUrl: movie.poster_local_path,
              movieTitle
            })
            continue
          }
        }

        // Upload l'affiche
        const uploadResult = await this.uploadPoster(posterFile)
        
        if (uploadResult.success && uploadResult.publicUrl) {
          console.log(`✅ Affiche ${options.force ? 'remplacée' : 'uploadée'}: ${uploadResult.publicUrl}`)
          totalUploaded++
          
          // Si le film existe en base, mettre à jour le poster_local_path
          if (movie) {
            const updateSuccess = await this.updateMoviePoster(posterFile.tmdbId, uploadResult.publicUrl)
            if (updateSuccess) {
              totalUpdated++
            }
          }

          results.push({
            tmdbId: posterFile.tmdbId,
            fileName: posterFile.fileName,
            success: uploadResult.success,
            action: 'uploaded',
            publicUrl: uploadResult.publicUrl,
            movieTitle
          })
        } else {
          console.error(`❌ Échec upload: ${uploadResult.error}`)
          results.push({
            tmdbId: posterFile.tmdbId,
            fileName: posterFile.fileName,
            success: false,
            action: 'error',
            movieTitle,
            error: uploadResult.error
          })
        }
      }

      console.log(`\\n🎉 Import terminé - ${totalUploaded} affiches uploadées, ${totalUpdated} films mis à jour, ${totalSkipped} ignorées`)

      return {
        success: true,
        totalFound: posterFiles.length,
        totalUploaded,
        totalUpdated,
        totalSkipped,
        results
      }

    } catch (error) {
      console.error(`💥 Erreur critique import affiches:`, error)
      return {
        success: false,
        totalFound: 0,
        totalUploaded: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        results: []
      }
    }
  }
}

export const posterImportService = new PosterImportService()