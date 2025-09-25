"use client"

import { Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useHydration } from "@/hooks"
import { ICON_SIZES, TRANSITION_CLASSES, HOVER_SCALE_CLASSES, FOCUS_CLASSES } from "@/constants"

interface PlayButtonProps {
  movieId: string
  className?: string
}

export function PlayButtonCompact({ movieId, className }: PlayButtonProps) {
  const router = useRouter()
  const { isHydrated } = useHydration()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/movie-player/${movieId}`)
  }

  // Return invisible placeholder during hydration to maintain layout
  if (!isHydrated) {
    return (
      <div
        className="absolute top-2 left-2 z-10 w-10 h-10 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "play-button absolute top-2 left-2 z-10",
        "bg-black/20 backdrop-blur-sm hover:bg-black/40",
        "border border-white/10",
        "rounded-full",
        // Force invisible state initially, only show on group hover
        "invisible opacity-0",
        "group-hover:visible group-hover:opacity-100",
        TRANSITION_CLASSES.SMOOTH,
        HOVER_SCALE_CLASSES.SUBTLE,
        FOCUS_CLASSES.DEFAULT,
        className
      )}
      aria-label="Regarder le film"
    >
      <Play
        size={ICON_SIZES.COMPACT}
        className={cn(
          TRANSITION_CLASSES.DEFAULT,
          "text-white/70 hover:text-white fill-white/70 hover:fill-white"
        )}
      />
    </Button>
  )
}