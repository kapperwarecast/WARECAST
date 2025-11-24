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
 * Un film est disponible si PERSONNE n'a de session active dessus (48h)
 */
export function useFilmAvailability(movieId: string): UseFilmAvailabilityReturn {
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const checkAvailability = async () => {
      try {
        setLoading(true)

        // Récupérer TOUTES les copies physiques du film (support multi-copies)
        const { data: registryData, error: registryError } = await supabase
          .from("films_registry")
          .select("id, current_owner_id")
          .eq("movie_id", movieId)
          .limit(100) // ✅ Accepte plusieurs copies physiques

        if (cancelled) return

        if (registryError) {
          console.error("Erreur récupération registre:", registryError)
          setIsAvailable(false)
          setOwnerId(null)
          setLoading(false)
          return
        }

        // Si aucune copie n'existe, film indisponible
        if (!registryData || registryData.length === 0) {
          setIsAvailable(false)
          setOwnerId(null)
          setLoading(false)
          return
        }

        // Stocker le premier propriétaire (pour info)
        setOwnerId(registryData[0].current_owner_id)

        // Vérifier si AU MOINS UNE copie est disponible (aucune session active)
        const registryIds = registryData.map(r => r.id)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("viewing_sessions")
          .select("registry_id")
          .in("registry_id", registryIds)
          .eq("statut", "en_cours")
          .gt("return_date", new Date().toISOString())

        if (cancelled) return

        if (sessionsError) {
          console.error("Erreur vérification sessions:", sessionsError)
          setIsAvailable(true) // Par défaut disponible en cas d'erreur
          setLoading(false)
          return
        }

        // Film disponible si AU MOINS UNE copie n'a pas de session active
        const busyRegistryIds = new Set((sessionsData || []).map(s => s.registry_id))
        const hasAvailableCopy = registryIds.some(id => !busyRegistryIds.has(id))

        setIsAvailable(hasAvailableCopy)
        setLoading(false)

        // Souscrire aux changements en temps réel des sessions sur TOUTES les copies physiques
        const channels = registryIds.map(registryId =>
          supabase
            .channel(`film-availability-${registryId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'viewing_sessions',
                filter: `registry_id=eq.${registryId}`,
              },
              () => {
                // Re-vérifier la disponibilité quand une session change
                checkAvailabilityRealtime(registryIds)
              }
            )
            .subscribe()
        )

        return () => {
          channels.forEach(ch => ch.unsubscribe())
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur useFilmAvailability:", error)
          setIsAvailable(true) // Par défaut disponible en cas d'erreur
          setLoading(false)
        }
      }
    }

    // Fonction pour re-vérifier la disponibilité en temps réel (sans loading)
    // Accepte maintenant un tableau de registryIds pour supporter multi-copies
    const checkAvailabilityRealtime = async (registryIds: string[]) => {
      try {
        const { data: sessionsData } = await supabase
          .from("viewing_sessions")
          .select("registry_id")
          .in("registry_id", registryIds)
          .eq("statut", "en_cours")
          .gt("return_date", new Date().toISOString())

        if (!cancelled) {
          // Film disponible si AU MOINS UNE copie n'a pas de session active
          const busyRegistryIds = new Set((sessionsData || []).map(s => s.registry_id))
          const hasAvailableCopy = registryIds.some(id => !busyRegistryIds.has(id))
          setIsAvailable(hasAvailableCopy)
        }
      } catch (error) {
        console.error("Erreur checkAvailabilityRealtime:", error)
      }
    }

    const cleanup = checkAvailability()

    return () => {
      cancelled = true
      cleanup?.then(unsubscribe => unsubscribe?.())
    }
  }, [movieId])

  return {
    isAvailable,
    loading,
    ownerId,
  }
}
