import { useCallback, useEffect, useRef } from "react"
import type { SaveVideoPositionRequest } from "@/types/playback"

/**
 * Hook pour gérer la sauvegarde automatique de la position de lecture vidéo
 *
 * Features:
 * - Auto-save toutes les 10 secondes pendant la lecture
 * - Sauvegarde à la fermeture de la page (beforeunload)
 * - Debouncing pour éviter trop de requêtes
 *
 * @param movieId - ID du film
 * @param rentalId - ID de l'emprunt actif
 */
export function useVideoPosition(movieId: string, rentalId: string) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedPositionRef = useRef<number>(0)
  const currentPositionRef = useRef<number>(0)
  const currentDurationRef = useRef<number>(0)

  /**
   * Fonction pour sauvegarder la position dans la base de données
   */
  const savePosition = useCallback(async (position: number, duration: number) => {
    // Ne pas sauvegarder si la position n'a pas changé de manière significative (> 1 seconde)
    if (Math.abs(position - lastSavedPositionRef.current) < 1) {
      console.log(`⏭️ Skip save - position change too small (${Math.abs(position - lastSavedPositionRef.current).toFixed(1)}s)`)
      return
    }

    try {
      const requestData: SaveVideoPositionRequest = {
        movieId,
        rentalId,
        position: Math.floor(position),
        duration: Math.floor(duration)
      }

      console.log(`💾 Saving position: ${Math.floor(position)}s / ${Math.floor(duration)}s`)

      const response = await fetch("/api/watch-sessions/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        lastSavedPositionRef.current = position
        console.log(`✅ Position saved successfully: ${Math.floor(position)}s`)
      } else {
        console.error("❌ Failed to save video position:", await response.text())
      }
    } catch (error) {
      console.error("❌ Error saving video position:", error)
    }
  }, [movieId, rentalId])

  /**
   * Fonction pour déclencher une sauvegarde intelligente
   * - Sauvegarde immédiate toutes les 10 secondes de lecture
   * - Sinon debounce de 3 secondes pour les petits changements
   */
  const debouncedSave = useCallback((position: number, duration: number) => {
    // Stocker la position actuelle
    currentPositionRef.current = position
    currentDurationRef.current = duration

    // Calculer le temps écoulé depuis la dernière sauvegarde
    const timeSinceLastSave = position - lastSavedPositionRef.current

    // Si 10 secondes de lecture se sont écoulées, sauvegarder immédiatement
    if (timeSinceLastSave >= 10) {
      console.log(`⚡ 10s elapsed - immediate save`)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      savePosition(position, duration)
      return
    }

    // Sinon, utiliser un debounce de 3 secondes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePosition(position, duration)
    }, 3000) // 3 secondes au lieu de 10
  }, [savePosition])

  /**
   * Fonction pour sauvegarder immédiatement (sans debouncing)
   * Utilisé lors de la pause ou fermeture de la page
   */
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const position = currentPositionRef.current
    const duration = currentDurationRef.current

    if (position > 0 && duration > 0) {
      savePosition(position, duration)
    }
  }, [savePosition])

  /**
   * Effet pour sauvegarder avant la fermeture de la page
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      const position = currentPositionRef.current
      const duration = currentDurationRef.current

      if (position > 0 && duration > 0) {
        // Utiliser sendBeacon pour garantir l'envoi même si la page se ferme
        const requestData: SaveVideoPositionRequest = {
          movieId,
          rentalId,
          position: Math.floor(position),
          duration: Math.floor(duration)
        }

        const blob = new Blob([JSON.stringify(requestData)], { type: 'application/json' })
        const sent = navigator.sendBeacon("/api/watch-sessions/save", blob)

        console.log(`🚀 sendBeacon sent: ${sent} - Position: ${Math.floor(position)}s`)
      }
    }

    // Événement avant fermeture de la page
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Événement visibilitychange (quand l'utilisateur change d'onglet)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("👁️ Tab hidden - saving position")
        saveImmediately()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      // Sauvegarder une dernière fois au démontage
      console.log("🔚 Component unmounting - final save")
      saveImmediately()

      // Cleanup event listeners
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [saveImmediately, movieId, rentalId])

  return {
    /**
     * Appeler cette fonction à chaque mise à jour de la position pendant la lecture
     * La sauvegarde sera déclenchée automatiquement avec debouncing
     */
    updatePosition: debouncedSave,

    /**
     * Appeler cette fonction pour sauvegarder immédiatement
     * Utile lors d'une pause ou d'autres événements importants
     */
    saveNow: saveImmediately
  }
}
