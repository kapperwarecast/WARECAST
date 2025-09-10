import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'photos'

export class PhotoStorageService {
  private async getSupabase() {
    return await createClient()
  }

  async uploadPhoto(imageUrl: string, storagePath: string): Promise<string | null> {
    try {
      console.log(`📸 PhotoStorage: Starting upload - URL: ${imageUrl}, Path: ${storagePath}`)
      
      const supabase = await this.getSupabase()
      
      // First, verify bucket exists and is accessible
      console.log(`📸 PhotoStorage: Checking bucket "${BUCKET_NAME}" accessibility`)
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      if (bucketError) {
        console.error(`📸 PhotoStorage: Error listing buckets:`, bucketError)
        throw new Error(`Bucket access error: ${bucketError.message}`)
      }
      
      const photoBucket = buckets?.find(b => b.name === BUCKET_NAME)
      if (!photoBucket) {
        console.error(`📸 PhotoStorage: Bucket "${BUCKET_NAME}" does not exist`)
        throw new Error(`Bucket "${BUCKET_NAME}" not found`)
      }
      console.log(`📸 PhotoStorage: Bucket "${BUCKET_NAME}" found and accessible`)
      
      // Check if photo already exists
      const directory = this.getDirectory(storagePath)
      const fileName = this.getFileName(storagePath)
      console.log(`📸 PhotoStorage: Checking if file exists - Directory: "${directory}", File: "${fileName}"`)
      
      const { data: existingFile, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(directory, {
          search: fileName
        })

      if (listError) {
        console.warn(`📸 PhotoStorage: Error checking existing file: ${listError.message}`)
        // Don't throw, continue with upload
      } else if (existingFile && existingFile.length > 0) {
        console.log(`📸 PhotoStorage: File already exists, returning existing URL: ${storagePath}`)
        const publicUrl = await this.getPublicUrl(storagePath)
        console.log(`📸 PhotoStorage: Existing file URL: ${publicUrl}`)
        return publicUrl
      }

      // Fetch image from TMDB
      console.log(`📸 PhotoStorage: Fetching image from TMDB: ${imageUrl}`)
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image from TMDB: ${response.status} ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const imageSize = imageBuffer.byteLength
      
      console.log(`📸 PhotoStorage: Image fetched successfully - Size: ${imageSize} bytes, Type: ${contentType}`)

      if (imageSize === 0) {
        throw new Error('Downloaded image is empty (0 bytes)')
      }

      // Upload to Supabase Storage
      console.log(`📸 PhotoStorage: Uploading to bucket "${BUCKET_NAME}" at path: ${storagePath}`)
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imageBuffer, {
          contentType,
          upsert: true,
          duplex: 'half'
        })

      if (error) {
        console.error(`📸 PhotoStorage: Upload failed - Error:`, {
          message: error.message,
          bucket: BUCKET_NAME,
          path: storagePath,
          contentType,
          imageSize
        })
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log(`📸 PhotoStorage: Upload successful - Data:`, data)
      
      const publicUrl = await this.getPublicUrl(storagePath)
      console.log(`📸 PhotoStorage: Final public URL: ${publicUrl}`)
      
      return publicUrl
    } catch (error) {
      console.error(`📸 PhotoStorage: Critical error uploading photo ${storagePath}:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        imageUrl,
        storagePath
      })
      return null
    }
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    const supabase = await this.getSupabase()
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)
    
    return data.publicUrl
  }

  private getDirectory(path: string): string {
    return path.substring(0, path.lastIndexOf('/'))
  }

  private getFileName(path: string): string {
    return path.substring(path.lastIndexOf('/') + 1)
  }

  static getActorPhotoPath(tmdbId: number): string {
    return `actors/tmdb_${tmdbId}.jpg`
  }

  static getDirectorPhotoPath(tmdbId: number): string {
    return `directors/tmdb_${tmdbId}.jpg`
  }
}

export const photoStorage = new PhotoStorageService()