"use client"

import { Heart } from "lucide-react"
import { useMovieLike } from "@/stores/like-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface LikeButtonProps {
  movieId: string
  className?: string
  compact?: boolean
  showCount?: boolean
}

export function LikeButton({
  movieId,
  className,
  compact = false,
  showCount = true,
}: LikeButtonProps) {
  const { isLiked, count, loading, hasPendingAction, toggle } = useMovieLike(movieId)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (loading) return

    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)

    try {
      await toggle()
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-full transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-red-500/50",
        compact
          ? "p-2 min-w-[44px] min-h-[44px]" // Touch-friendly size for mobile
          : "px-3 py-2",
        loading && "opacity-50 cursor-not-allowed",
        isAnimating && "scale-110",
        className
      )}
      aria-label={isLiked ? "Unlike this movie" : "Like this movie"}
    >
      <Heart
        size={compact ? 20 : 24}
        className={cn(
          "transition-all duration-200",
          isLiked
            ? "fill-red-500 text-red-500" // Filled red heart
            : "text-white/70 hover:text-white", // Empty white heart
          loading && "animate-pulse",
          isAnimating && "scale-125"
        )}
      />

      {/* Show count only if not compact or explicitly requested */}
      {showCount && !compact && count > 0 && (
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            isLiked ? "text-red-500" : "text-white/70"
          )}
        >
          {count}
        </span>
      )}

      {/* Pending indicator for offline usage */}
      {hasPendingAction && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
          title="Pending sync"
        />
      )}
    </button>
  )
}

// Compact version specifically for cards with hydration fix
export function LikeButtonCompact(props: Omit<LikeButtonProps, "compact" | "showCount">) {
  const { isLiked, loading, hasPendingAction, toggle } = useMovieLike(props.movieId)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration issue - only show after client mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (loading) return

    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)

    try {
      await toggle()
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "absolute top-2 right-2 z-10",
        "bg-black/20 backdrop-blur-sm hover:bg-black/40",
        "border border-white/10",
        "rounded-full",
        "opacity-0 group-hover:opacity-100",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-red-500/50",
        loading && "opacity-50 cursor-not-allowed",
        isAnimating && "scale-110",
        props.className
      )}
      aria-label={isLiked ? "Unlike this movie" : "Like this movie"}
    >
      <Heart
        size={16}
        className={cn(
          "transition-all duration-200",
          isLiked
            ? "fill-red-500 text-red-500"
            : "text-white/70 hover:text-white",
          loading && "animate-pulse",
          isAnimating && "scale-125"
        )}
      />

      {/* Pending indicator for offline usage */}
      {hasPendingAction && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
          title="Pending sync"
        />
      )}
    </Button>
  )
}
