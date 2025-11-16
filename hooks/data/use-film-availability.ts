"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseFilmAvailabilityReturn {
  isAvailable: boolean
  loading: boolean
  ownerId: string | null
}

/**
 * Hook pour vérifier la disponibilité d'un film
 * Un film est disponible si son propriétaire n'a PAS de session active (48h)
 */
export function useFilmAvailability(movieId: string): UseFilmAvailabilityReturn {
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkAvailability = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Récupérer le propriétaire du film
        // Type cast needed: films_registry table exists in DB but not in generated types yet
        const { data: registryData, error: registryError } = await (
          supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from<any>>
        )("films_registry")
          .select("id, current_owner_id")
          .eq("movie_id", movieId)
          .single()

        if (cancelled) return

        if (registryError || !registryData) {
          // Film pas dans le registre → considéré comme indisponible
          setIsAvailable(false)
          setOwnerId(null)
          setLoading(false)
          return
        }

        setOwnerId(registryData.current_owner_id)

        // Vérifier si le propriétaire a une session active
        const { data: sessionData, error: sessionError } = await supabase
          .from("emprunts")
          .select("id")
          .eq("user_id", registryData.current_owner_id)
          .eq("movie_id", movieId)
          .eq("statut", "en_cours")
          .gt("date_retour", new Date().toISOString())
          .maybeSingle()

        if (cancelled) return

        if (sessionError) {
          console.error("Erreur vérification session:", sessionError)
          setIsAvailable(true) // Par défaut disponible en cas d'erreur
          setLoading(false)
          return
        }

        // Film disponible si AUCUNE session active
        setIsAvailable(!sessionData)
        setLoading(false)
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur useFilmAvailability:", error)
          setIsAvailable(true) // Par défaut disponible en cas d'erreur
          setLoading(false)
        }
      }
    }

    checkAvailability()

    return () => {
      cancelled = true
    }
  }, [movieId])

  return {
    isAvailable,
    loading,
    ownerId,
  }
}
