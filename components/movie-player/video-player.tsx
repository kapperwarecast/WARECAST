"use client"

import { useEffect, useRef } from "react"
import { AlertCircle, Play } from "lucide-react"
import type { VideoPlayerProps } from "@/types/player"
import { getVimeoVideoData, getVimeoEmbedUrl } from "@/lib/utils/vimeo"
import { useVideoPosition } from "@/hooks/data/use-video-position"

export function VideoPlayer({ vimeoUrl, title, startTime = 0, movieId, rentalId }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentPositionRef = useRef<number>(startTime)
  const currentDurationRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)
  const lastSavedPositionRef = useRef<number>(startTime)
  const hasInitializedBaselineRef = useRef<boolean>(false)
  const videoData = getVimeoVideoData(vimeoUrl)

  // Hook pour sauvegarder automatiquement la position
  const { updatePosition, saveNow } = useVideoPosition(movieId, rentalId)

  useEffect(() => {
    // Early return if video is invalid
    if (!videoData.isValid || !videoData.id) {
      return
    }
    console.log("🎬 Video player mounted - Starting Vimeo API tracking")
    console.log(`⏩ Start time: ${startTime}s`)

    const iframe = iframeRef.current
    if (!iframe) return

    // Écouter les messages postMessage de Vimeo
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine (accepter tous les domaines Vimeo)
      if (!event.origin.includes('vimeo.com')) return

      try {
        const data = JSON.parse(event.data)

        // Debug: Logger tous les événements Vimeo
        if (data.event) {
          console.log('📥 Vimeo event:', data.event, data)
        }

        // Événement: vidéo prête
        if (data.event === 'ready') {
          console.log("✅ Vimeo player ready")
          // S'abonner aux événements
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*')
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'pause' }), '*')
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'playProgress' }), '*')
        }

        // Événement: lecture commence
        if (data.event === 'play') {
          console.log("▶️ Video playing - Starting counter")
          isPlayingRef.current = true
          hasInitializedBaselineRef.current = false
        }

        // Événement: pause
        if (data.event === 'pause') {
          console.log("⏸️ Video paused - Stopping counter")
          isPlayingRef.current = false
          // Sauvegarder immédiatement la position actuelle
          if (currentPositionRef.current > 0) {
            saveNow()
            lastSavedPositionRef.current = currentPositionRef.current
          }
        }

        // Événement: mise à jour du temps (playProgress se déclenche périodiquement)
        if (data.event === 'playProgress' && data.data) {
          const position = data.data.seconds
          const duration = data.data.duration

          // Mettre à jour les refs avec la position réelle de Vimeo
          currentPositionRef.current = position
          currentDurationRef.current = duration

          // Initialiser la baseline au premier playProgress après un play
          if (!hasInitializedBaselineRef.current && isPlayingRef.current) {
            lastSavedPositionRef.current = position
            hasInitializedBaselineRef.current = true
            console.log(`📍 Baseline position set: ${Math.floor(position)}s`)
          }

          // Log toutes les 10 secondes
          if (Math.floor(position) % 10 === 0 && Math.floor(position) !== 0) {
            console.log(`⏱️ Position réelle: ${Math.floor(position)}s / ${Math.floor(duration)}s`)
          }
        }
      } catch (error) {
        // Ignorer les messages non-JSON
      }
    }

    // Ajouter le listener
    window.addEventListener('message', handleMessage)

    // Interval pour sauvegarder toutes les 10 secondes (seulement si en lecture)
    intervalRef.current = setInterval(() => {
      if (isPlayingRef.current && currentPositionRef.current > 0) {
        const position = currentPositionRef.current
        const duration = currentDurationRef.current

        // Sauvegarder toutes les 10 secondes de lecture vidéo (position-delta)
        if (position - lastSavedPositionRef.current >= 10) {
          console.log(`💾 Auto-save at ${Math.floor(position)}s (last save: ${Math.floor(lastSavedPositionRef.current)}s)`)
          updatePosition(position, duration || 7200)
          lastSavedPositionRef.current = position
        }
      }
    }, 1000)

    // Cleanup
    return () => {
      console.log("🔚 Video player unmounting - Final save")
      window.removeEventListener('message', handleMessage)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Sauvegarder une dernière fois
      saveNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, videoData.isValid, videoData.id])

  // Construire l'URL Vimeo avec le temps de départ
  const embedUrl = getVimeoEmbedUrl(videoData.id!, {
    autoplay: startTime > 0, // Auto-start si reprise de lecture
    title: false,
    byline: false,
    portrait: false,
  })

  // Ajouter le fragment de temps pour reprendre à une position spécifique
  const embedUrlWithTime = startTime > 0
    ? `${embedUrl}#t=${Math.floor(startTime)}s`
    : embedUrl

  // Debug: Logger l'URL pour vérifier api=1
  console.log('🎬 Embed URL:', embedUrlWithTime)

  // Validation check after all hooks
  if (!videoData.isValid || !videoData.id) {
    return <VideoPlayerError title={title} />
  }

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          key={`vimeo-${videoData.id}-${startTime}`} // Force reload quand startTime change
          src={embedUrlWithTime}
          title={`Lecture de ${title}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}

function VideoPlayerError({ title }: { title: string }) {
  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            Vidéo non disponible
          </h3>

          <p className="text-zinc-400 text-sm mb-4">
            La vidéo pour <span className="font-medium text-white">{title}</span> n&apos;est
            pas encore disponible ou le lien est invalide.
          </p>

          <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
            <Play className="w-4 h-4" />
            <span>Contenu en cours de traitement</span>
          </div>
        </div>
      </div>
    </div>
  )
}