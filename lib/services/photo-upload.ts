interface UploadPhotoRequest {
  tmdbImageUrl: string
  storagePath: string
}

interface UploadPhotoResponse {
  success: boolean
  publicUrl?: string
  error?: string
}

export class PhotoUploadService {
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

  async uploadPhoto(tmdbImageUrl: string, storagePath: string): Promise<string | null> {
    try {
      console.log(`🚀 PhotoUploadService: Calling Edge Function for ${storagePath}`)
      
      const supabaseUrl = this.getSupabaseUrl()
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-photo`
      
      const requestBody: UploadPhotoRequest = {
        tmdbImageUrl,
        storagePath
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
        console.error(`🚀 PhotoUploadService: Edge Function HTTP error ${response.status}:`, errorText)
        throw new Error(`Edge Function request failed: ${response.status} ${response.statusText}`)
      }

      const result: UploadPhotoResponse = await response.json()
      
      if (!result.success) {
        console.error(`🚀 PhotoUploadService: Edge Function returned error:`, result.error)
        throw new Error(`Upload failed: ${result.error}`)
      }

      console.log(`✅ PhotoUploadService: Upload successful, URL: ${result.publicUrl}`)
      return result.publicUrl || null

    } catch (error) {
      console.error(`💥 PhotoUploadService: Error uploading ${storagePath}:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        tmdbImageUrl,
        storagePath
      })
      return null
    }
  }

  static getActorPhotoPath(tmdbId: number): string {
    return `actors/tmdb_${tmdbId}.jpg`
  }

  static getDirectorPhotoPath(tmdbId: number): string {
    return `directors/tmdb_${tmdbId}.jpg`
  }
}

export const photoUploadService = new PhotoUploadService()