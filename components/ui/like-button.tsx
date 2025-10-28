"use client"

import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLikeButtonLogic } from "@/hooks/ui"
import { useHydration } from "@/hooks/use-hydration"
import { ICON_SIZES, TRANSITION_CLASSES, HOVER_SCALE_CLASSES, FOCUS_CLASSES } from "@/constants"
import type { LikeButtonProps, BaseLikeButtonProps } from "@/types"

export function LikeButton({
  movieId,
  className,
  compact = false,
  showCount = true,
}: LikeButtonProps) {
  const {
    isLiked,
    count,
    loading,
    hasPendingAction,
    isAnimating,
    handleClick,
    ariaLabel,
  } = useLikeButtonLogic({ movieId })

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-full",
        TRANSITION_CLASSES.DEFAULT,
        HOVER_SCALE_CLASSES.SUBTLE,
        FOCUS_CLASSES.DEFAULT,
        compact
          ? "p-2 min-w-[44px] min-h-[44px]" // Touch-friendly size for mobile
          : "px-3 py-2",
        loading && "opacity-50 cursor-not-allowed",
        isAnimating && "scale-110",
        className
      )}
      aria-label={ariaLabel}
    >
      <Heart
        size={compact ? ICON_SIZES.NORMAL : ICON_SIZES.LARGE}
        className={cn(
          TRANSITION_CLASSES.DEFAULT,
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
export function LikeButtonCompact(props: BaseLikeButtonProps) {
  const {
    isLiked,
    loading,
    hasPendingAction,
    isAnimating,
    handleClick,
    ariaLabel,
  } = useLikeButtonLogic({ movieId: props.movieId })

  const { isHydrated } = useHydration()

  // Return invisible placeholder during hydration to maintain layout
  if (!isHydrated) {
    return (
      <div
        className="absolute top-2 right-2 z-10 w-10 h-10 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "like-button absolute top-2 right-2 z-10",
        "size-9",
        "inline-flex items-center justify-center",
        "backdrop-blur-sm",
        "rounded-full",
        "overflow-hidden",
        // Styles conditionnels selon l'état liked
        isLiked
          ? "!bg-orange-600 !border-2 !border-white hover:!bg-orange-700"
          : "!bg-transparent !border-2 !border-white hover:!bg-orange-600",
        // Force invisible state initially, only show on group hover
        "invisible opacity-0",
        "group-hover:visible group-hover:opacity-100",
        "transition-all duration-200 ease-out", // Même transition que le bouton play
        HOVER_SCALE_CLASSES.SUBTLE,
        FOCUS_CLASSES.DEFAULT,
        loading && "opacity-50 cursor-not-allowed",
        isAnimating && "scale-110",
        props.className
      )}
      aria-label={isHydrated ? ariaLabel : "Toggle favorite"}
    >
      <Heart
        size={ICON_SIZES.COMPACT}
        className={cn(
          TRANSITION_CLASSES.DEFAULT,
          "!fill-white !text-white",
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
    </button>
  )
}