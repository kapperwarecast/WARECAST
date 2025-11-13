import { createClient } from '@/lib/supabase/server'
import { tmdbClient } from './client'
import { photoUploadService, PhotoUploadService } from '@/lib/services/photo-upload'
import { parseName } from '@/lib/utils/name-parser'
import type { MovieImportResult, TMDBMovie, TMDBCredits } from './types'
import type { TablesInsert } from '@/lib/supabase/types'

// Type definitions for database tables
// type Movie = Tables<"movies">
// type Actor = Tables<"actors">
// type Director = Tables<"directors">

export class MovieImportService {
  private async getSupabase() {
    return await createClient()
  }

  async importMovie(tmdbId: number): Promise<MovieImportResult> {
    try {
      console.log(`Starting import for TMDB ID: ${tmdbId}`)
      
      const supabase = await this.getSupabase()
      
      // Check if movie already exists
      const { data: existingMovie } = await supabase
        .from('movies')
        .select('id, titre_francais, titre_original')
        .eq('tmdb_id', tmdbId)
        .single()

      if (existingMovie) {
        return {
          success: true,
          movieId: existingMovie.id,
          tmdbId,
          title: existingMovie.titre_francais || existingMovie.titre_original || 'Unknown',
          error: 'Movie already exists'
        }
      }

      // Fetch movie data from TMDB
      const [movieData, creditsData] = await Promise.all([
        tmdbClient.getMovie(tmdbId),
        tmdbClient.getMovieCredits(tmdbId)
      ])

      // Import the movie
      const movieId = await this.importMovieData(movieData)

      // Import actors and directors in parallel
      const [actorsImported, directorsImported] = await Promise.all([
        this.importActors(movieId, creditsData),
        this.importDirectors(movieId, creditsData)
      ])

      return {
        success: true,
        movieId,
        tmdbId,
        title: movieData.title,
        actorsImported,
        directorsImported
      }
    } catch (error) {
      console.error(`Failed to import movie ${tmdbId}:`, error)
      return {
        success: false,
        tmdbId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async importMovieData(movieData: TMDBMovie): Promise<string> {
    const supabase = await this.getSupabase()

    const annee_sortie = movieData.release_date ? new Date(movieData.release_date).getFullYear() : null

    // Import slug generation utilities
    const { generateFilmSlug } = await import('@/lib/utils/slug')

    // Generate slug
    const slug = generateFilmSlug({
      titre_francais: movieData.title,
      titre_original: movieData.original_title,
      annee_sortie
    })

    const movieInsert: TablesInsert<"movies"> = {
      tmdb_id: movieData.id,
      slug,
      titre_francais: movieData.title,
      titre_original: movieData.original_title,
      duree: movieData.runtime,
      genres: movieData.genres.map(g => g.name),
      langue_vo: movieData.original_language,
      annee_sortie,
      synopsis: movieData.overview || null,
      note_tmdb: movieData.vote_average,
      poster_local_path: null // Will be set later when posters are provided
    }

    const { data, error } = await supabase
      .from('movies')
      .insert(movieInsert)
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to insert movie: ${error.message}`)
    }

    return data.id
  }

  private async importActors(movieId: string, credits: TMDBCredits): Promise<number> {
    const supabase = await this.getSupabase()
    let importedCount = 0
    
    // Process main cast (first 20 actors to avoid too many API calls)
    const mainCast = credits.cast.slice(0, 20)
    
    for (const castMember of mainCast) {
      try {
        // Check if actor exists
        let actor = await this.findActorByTmdbId(castMember.id)
        
        if (!actor) {
          // Create new actor
          const photoUrl = castMember.profile_path ? 
            tmdbClient.getImageUrl(castMember.profile_path) : null
          
          let photoPath: string | null = null
          if (photoUrl) {
            console.log(`🎭 MovieImport: Attempting to upload actor photo for ${castMember.name} (TMDB ID: ${castMember.id}) via Edge Function`)
            const storagePath = PhotoUploadService.getActorPhotoPath(castMember.id)
            try {
              photoPath = await photoUploadService.uploadPhoto(photoUrl, storagePath)
              if (photoPath) {
                console.log(`✅ Actor photo uploaded successfully via Edge Function: ${photoPath}`)
              } else {
                console.warn(`❌ Actor photo upload failed via Edge Function for ${castMember.name}, continuing without photo`)
              }
            } catch (error) {
              console.error(`💥 Actor photo upload error via Edge Function for ${castMember.name}:`, error)
            }
          } else {
            console.log(`📷 No profile photo available for actor ${castMember.name}`)
          }

          // Séparer le nom complet en nom et prénom
          const parsedName = parseName(castMember.name)
          console.log(`Parsing actor name: "${castMember.name}" → prénom: "${parsedName.prenom}", nom: "${parsedName.nom}"`)

          // Import slug generation utilities
          const { generatePersonSlug } = await import('@/lib/utils/slug')

          // Generate slug for actor
          const actorSlug = generatePersonSlug({
            prenom: parsedName.prenom || null,
            nom: parsedName.nom || null,
            nom_complet: castMember.name
          })

          const actorInsert: TablesInsert<"actors"> = {
            tmdb_id: castMember.id,
            slug: actorSlug,
            nom_complet: castMember.name,
            prenom: parsedName.prenom || null,
            nom: parsedName.nom || null,
            photo_path: photoPath
          }

          const { data, error } = await supabase
            .from('actors')
            .insert(actorInsert)
            .select('id')
            .single()

          if (error) {
            console.error(`Failed to insert actor ${castMember.name}:`, error)
            continue
          }

          actor = { id: data.id }
        }

        // Create movie-actor relationship
        await supabase
          .from('movie_actors')
          .insert({
            movie_id: movieId,
            actor_id: actor.id,
            role_personnage: castMember.character,
            ordre_casting: castMember.order
          })

        importedCount++
      } catch (error) {
        console.error(`Failed to process actor ${castMember.name}:`, error)
      }
    }

    return importedCount
  }

  private async importDirectors(movieId: string, credits: TMDBCredits): Promise<number> {
    const supabase = await this.getSupabase()
    let importedCount = 0
    
    // Find directors in crew
    const directors = credits.crew.filter(member => member.job === 'Director')
    
    for (const director of directors) {
      try {
        // Check if director exists
        let directorRecord = await this.findDirectorByTmdbId(director.id)
        
        if (!directorRecord) {
          // Create new director
          const photoUrl = director.profile_path ? 
            tmdbClient.getImageUrl(director.profile_path) : null
          
          let photoPath: string | null = null
          if (photoUrl) {
            console.log(`🎬 MovieImport: Attempting to upload director photo for ${director.name} (TMDB ID: ${director.id}) via Edge Function`)
            const storagePath = PhotoUploadService.getDirectorPhotoPath(director.id)
            try {
              photoPath = await photoUploadService.uploadPhoto(photoUrl, storagePath)
              if (photoPath) {
                console.log(`✅ Director photo uploaded successfully via Edge Function: ${photoPath}`)
              } else {
                console.warn(`❌ Director photo upload failed via Edge Function for ${director.name}, continuing without photo`)
              }
            } catch (error) {
              console.error(`💥 Director photo upload error via Edge Function for ${director.name}:`, error)
            }
          } else {
            console.log(`📷 No profile photo available for director ${director.name}`)
          }

          // Séparer le nom complet en nom et prénom
          const parsedName = parseName(director.name)
          console.log(`Parsing director name: "${director.name}" → prénom: "${parsedName.prenom}", nom: "${parsedName.nom}"`)

          // Import slug generation utilities
          const { generatePersonSlug } = await import('@/lib/utils/slug')

          // Generate slug for director
          const directorSlug = generatePersonSlug({
            prenom: parsedName.prenom || null,
            nom: parsedName.nom || null,
            nom_complet: director.name
          })

          const directorInsert: TablesInsert<"directors"> = {
            tmdb_id: director.id,
            slug: directorSlug,
            nom_complet: director.name,
            prenom: parsedName.prenom || null,
            nom: parsedName.nom || null,
            photo_path: photoPath
          }

          const { data, error } = await supabase
            .from('directors')
            .insert(directorInsert)
            .select('id')
            .single()

          if (error) {
            console.error(`Failed to insert director ${director.name}:`, error)
            continue
          }

          directorRecord = { id: data.id }
        }

        // Create movie-director relationship
        await supabase
          .from('movie_directors')
          .insert({
            movie_id: movieId,
            director_id: directorRecord.id,
            job: director.job
          })

        importedCount++
      } catch (error) {
        console.error(`Failed to process director ${director.name}:`, error)
      }
    }

    return importedCount
  }

  private async findActorByTmdbId(tmdbId: number): Promise<{ id: string } | null> {
    const supabase = await this.getSupabase()
    const { data } = await supabase
      .from('actors')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .single()
    
    return data
  }

  private async findDirectorByTmdbId(tmdbId: number): Promise<{ id: string } | null> {
    const supabase = await this.getSupabase()
    const { data } = await supabase
      .from('directors')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .single()
    
    return data
  }
}

export const movieImportService = new MovieImportService()