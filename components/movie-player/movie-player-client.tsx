"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { VideoPlayer } from "./video-player"
import { ResumeModal } from "./resume-modal"
import type { VideoResumeResponse } from "@/types/playback"

interface MoviePlayerClientProps {
  movieId: string
  vimeoUrl: string | null
  title: string
}

/**
 * Composant client pour gérer la logique de reprise de lecture
 * Affiche la modale si une position existe, sinon démarre directement le player
 */
export function MoviePlayerClient({ movieId, vimeoUrl, title }: MoviePlayerClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [rentalId, setRentalId] = useState<string | null>(null)
  const [resumeData, setResumeData] = useState<VideoResumeResponse | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const { user } = useAuth()

  // Ref pour empêcher la modale de réapparaître pendant la lecture
  const hasShownModalRef = useRef(false)

  // Fetch rental ID et position de lecture au montage
  useEffect(() => {
    async function fetchRentalAndResumePosition() {
      // Guard : ne pas refetch si pas de user ou si modale déjà affichée
      if (!user || hasShownModalRef.current) {
        setIsLoading(false)
        return
      }

      try {
        // 1. Récupérer le rental ID
        const supabase = createClient()
        const { data: rental } = await supabase
          .from("viewing_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("movie_id", movieId)
          .eq("statut", "en_cours")
          .single()

        if (rental) {
          setRentalId(rental.id)
        }

        // 2. Récupérer la position de reprise
        const response = await fetch(`/api/watch-sessions/${movieId}`)
        const data: VideoResumeResponse = await response.json()

        if (data.success && data.data && data.data.position > 0) {
          setResumeData(data)
          setShowResumeModal(true)
          hasShownModalRef.current = true // Marquer comme affichée
        }
      } catch (error) {
        console.error("Error fetching rental or resume position:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRentalAndResumePosition()
  }, [movieId, user])

  const handleResume = () => {
    if (resumeData?.data) {
      setStartTime(resumeData.data.position)
    }
    setShowResumeModal(false)
    setIsLoading(false)
  }

  const handleRestart = () => {
    setStartTime(0)
    setShowResumeModal(false)
    setIsLoading(false)
  }

  // Afficher un loader pendant le chargement initial ou si pas de rental
  if (isLoading || !rentalId) {
    return (
      <div className="w-full">
        <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="text-zinc-400 text-sm mt-4">
              {isLoading ? "Chargement du lecteur..." : "Vérification de l'accès..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modale de reprise */}
      {showResumeModal && resumeData?.data && (
        <ResumeModal
          position={resumeData.data.position}
          duration={resumeData.data.duration}
          onResume={handleResume}
          onRestart={handleRestart}
        />
      )}

      {/* Player vidéo */}
      <VideoPlayer
        vimeoUrl={vimeoUrl}
        title={title}
        startTime={startTime}
        movieId={movieId}
        rentalId={rentalId}
      />
    </>
  )
}
