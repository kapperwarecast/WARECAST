// Types for Like Button components

export interface BaseLikeButtonProps {
  movieId: string
  className?: string
}

export interface LikeButtonProps extends BaseLikeButtonProps {
  compact?: boolean
  showCount?: boolean
}

export interface LikeButtonState {
  isLiked: boolean
  count: number
  loading: boolean
  hasPendingAction: boolean
  isAnimating: boolean
}

export type LikeButtonVariant = "default" | "compact"

export interface LikeButtonStyleConfig {
  variant: LikeButtonVariant
  iconSize: number
  containerClasses: string[]
  iconClasses: string[]
}