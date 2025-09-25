"use client"

import { AlertCircle, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VideoPlayerProps } from "@/types/player"
import { getVimeoVideoData, getVimeoEmbedUrl } from "@/lib/utils/vimeo"

export function VideoPlayer({ vimeoUrl, title }: VideoPlayerProps) {
  const videoData = getVimeoVideoData(vimeoUrl)

  if (!videoData.isValid || !videoData.id) {
    return <VideoPlayerError title={title} />
  }

  const embedUrl = getVimeoEmbedUrl(videoData.id, {
    autoplay: false,
    title: false,
    byline: false,
    portrait: false,
  })

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
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
            La vidéo pour <span className="font-medium text-white">{title}</span> n'est
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