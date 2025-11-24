"use client"

import { useState } from "react"
import { useMovieLike } from "@/stores/like-store"
import { ANIMATION_DURATIONS } from "@/constants"

interface UseLikeButtonLogicProps {
  movieId: string
  isHydrated?: boolean
}

export function useLikeButtonLogic({ movieId, isHydrated = true }: UseLikeButtonLogicProps) {
  const { isLiked, count, loading, hasPendingAction, toggle } = useMovieLike(movieId)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (loading) return

    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATIONS.LIKE_ANIMATION)

    try {
      await toggle()
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  return {
    // State
    isLiked,
    count,
    loading,
    hasPendingAction,
    isAnimating,

    // Actions
    handleClick,

    // Computed properties
    ariaLabel: isHydrated ? (isLiked ? "Unlike this movie" : "Like this movie") : "Toggle favorite",
  }
}