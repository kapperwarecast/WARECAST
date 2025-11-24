"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseRegistryAvailabilityReturn {
  isAvailable: boolean
  loading: boolean
}

/**
 * Hook to check if a SPECIFIC physical copy (registry_id) is available
 * Used for owned films where user has a specific copy
 */
export function useRegistryAvailability(registryId: string | undefined): UseRegistryAvailabilityReturn {
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Skip if no registryId provided
    if (!registryId) {
      setIsAvailable(true)
      setLoading(false)
      return
    }

    let cancelled = false
    const supabase = createClient()

    const checkAvailability = async () => {
      try {
        setLoading(true)

        // Check if THIS specific copy has an active session
        const { data: sessionData, error } = await supabase
          .from("viewing_sessions")
          .select("id")
          .eq("registry_id", registryId)
          .eq("statut", "en_cours")
          .gt("return_date", new Date().toISOString())
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.error("Error checking registry availability:", error)
          setIsAvailable(true)
          setLoading(false)
          return
        }

        setIsAvailable(!sessionData)
        setLoading(false)

        // Subscribe to realtime changes
        const channel = supabase
          .channel(`registry-availability-${registryId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'viewing_sessions',
              filter: `registry_id=eq.${registryId}`,
            },
            () => {
              checkAvailabilityRealtime()
            }
          )
          .subscribe()

        return () => {
          channel.unsubscribe()
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error useRegistryAvailability:", error)
          setIsAvailable(true)
          setLoading(false)
        }
      }
    }

    const checkAvailabilityRealtime = async () => {
      try {
        const { data: sessionData } = await supabase
          .from("viewing_sessions")
          .select("id")
          .eq("registry_id", registryId)
          .eq("statut", "en_cours")
          .gt("return_date", new Date().toISOString())
          .maybeSingle()

        if (!cancelled) {
          setIsAvailable(!sessionData)
        }
      } catch (error) {
        console.error("Error checkAvailabilityRealtime:", error)
      }
    }

    const cleanup = checkAvailability()

    return () => {
      cancelled = true
      cleanup?.then(unsubscribe => unsubscribe?.())
    }
  }, [registryId])

  return {
    isAvailable,
    loading,
  }
}
