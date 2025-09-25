// UI Constants for consistent design system

export const ANIMATION_DURATIONS = {
  // Button animations
  LIKE_ANIMATION: 200,
  HOVER_TRANSITION: 300,
  FOCUS_TRANSITION: 200,

  // Hydration
  HYDRATION_DELAY: 100,
} as const

export const ICON_SIZES = {
  COMPACT: 16,
  NORMAL: 20,
  LARGE: 24,
} as const

export const BUTTON_SIZES = {
  COMPACT: {
    width: 40,
    height: 40,
    padding: 2,
  },
  NORMAL: {
    minWidth: 44,
    minHeight: 44,
    padding: 3,
  },
} as const

// CSS class constants for consistency
export const TRANSITION_CLASSES = {
  DEFAULT: "transition-all duration-200",
  SMOOTH: "transition-all duration-300 ease-out",
  FAST: "transition-all duration-150",
} as const

export const HOVER_SCALE_CLASSES = {
  SUBTLE: "hover:scale-105 active:scale-95",
  NORMAL: "hover:scale-110 active:scale-90",
} as const

export const FOCUS_CLASSES = {
  DEFAULT: "focus:outline-none focus:ring-2 focus:ring-red-500/50",
  STRONG: "focus:outline-none focus:ring-2 focus:ring-red-500",
} as const