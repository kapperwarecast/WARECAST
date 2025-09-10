import type { TMDBMovie, TMDBCredits, TMDBPerson } from './types'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is required')
}

// Simple rate limiter class
class RateLimiter {
  private requests: number[] = []
  private maxRequests = 40
  private timeWindow = 10000 // 10 seconds

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    // If we've hit the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.timeWindow - (now - oldestRequest) + 100 // Add 100ms buffer
      
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter()

async function tmdbRequest<T>(endpoint: string): Promise<T> {
  await rateLimiter.waitIfNeeded()
  
  const url = `${TMDB_BASE_URL}${endpoint}`
  console.log(`TMDB Request: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  console.log(`TMDB Response: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const responseText = await response.text()
    console.error(`TMDB Error Response: ${responseText}`)
    
    if (response.status === 404) {
      throw new Error(`TMDB resource not found: ${endpoint}`)
    }
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
  }

  const responseText = await response.text()
  
  try {
    return JSON.parse(responseText)
  } catch {
    console.error(`TMDB JSON Parse Error: ${responseText}`)
    throw new Error(`Invalid JSON response from TMDB: ${responseText.substring(0, 100)}...`)
  }
}

export const tmdbClient = {
  async getMovie(movieId: number): Promise<TMDBMovie> {
    return tmdbRequest<TMDBMovie>(`/movie/${movieId}?language=fr-FR`)
  },

  async getMovieCredits(movieId: number): Promise<TMDBCredits> {
    return tmdbRequest<TMDBCredits>(`/movie/${movieId}/credits`)
  },

  async getPerson(personId: number): Promise<TMDBPerson> {
    return tmdbRequest<TMDBPerson>(`/person/${personId}?language=fr-FR`)
  },

  getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null
    return `https://image.tmdb.org/t/p/${size}${path}`
  }
}