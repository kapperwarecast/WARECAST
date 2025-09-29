"use client"

import { useState, useEffect } from "react"

interface MovieCache {
  [movieId: string]: {
    data: any
    timestamp: number
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

let movieCache: MovieCache = {}

export function useMovieInfo(movieId: string) {
  const [movieInfo, setMovieInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!movieId) return

    const cachedMovie = movieCache[movieId]
    const now = Date.now()

    // Utiliser le cache si disponible et récent
    if (cachedMovie && (now - cachedMovie.timestamp) < CACHE_DURATION) {
      setMovieInfo(cachedMovie.data)
      return
    }

    // Sinon, fetch depuis l'API
    const fetchMovie = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/movies/${movieId}`)
        const data = await response.json()
        
        // Mettre en cache
        movieCache[movieId] = {
          data,
          timestamp: now
        }
        
        setMovieInfo(data)
      } catch (error) {
        console.error("Erreur récupération film:", error)
        // Fallback si erreur
        setMovieInfo({
          titre_francais: "Film",
          titre_original: "Film"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [movieId])

  return { movieInfo, loading }
}
