import { Tables } from "@/lib/supabase/types"

// ============================================================================
// TYPES DE BASE (depuis Supabase)
// ============================================================================

export type Sponsorship = Tables<"sponsorships">
export type SponsorBadge = Tables<"sponsor_badges">

// ============================================================================
// TYPES ENRICHIS (avec relations)
// ============================================================================

export interface SponsorshipWithDetails extends Sponsorship {
  sponsor: {
    id: string
    username: string | null
    email?: string
  }
  sponsored_user: {
    id: string
    username: string | null
    email?: string
  }
  film_given: {
    id: string
    movie_title: string
    physical_support_type: string
  }
}

export interface SponsorBadgeWithUser extends SponsorBadge {
  user: {
    id: string
    username: string | null
    email?: string
  }
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export type BadgeLevel = "bronze" | "silver" | "gold"

// ============================================================================
// TYPES DE RÉPONSE RPC
// ============================================================================

export interface AssignWelcomeFilmResponse {
  success: boolean
  sponsor_id?: string
  film_registry_id?: string
  film_movie_id?: string
  film_title?: string
  new_badge_awarded?: BadgeLevel | null
  message: string
  error?: string
}

export interface MySponsor {
  sponsor_id: string
  sponsor_email: string
  film_title: string
  sponsorship_date: string
  badge_awarded: BadgeLevel | null
}

export interface MySponsoredUser {
  sponsored_user_id: string
  sponsored_user_email: string
  film_title: string
  sponsorship_date: string
}

export interface UserBadge {
  badge_level: BadgeLevel
  sponsorship_count: number
  awarded_at: string
}

// ============================================================================
// TYPES POUR L'UI
// ============================================================================

export interface SponsorshipCardData {
  sponsorship_id: string
  sponsor_name: string | null
  film_title: string
  sponsorship_date: Date
  badge_earned: BadgeLevel | null
}

export interface BadgeDisplayData {
  level: BadgeLevel
  count: number
  awarded_date: Date
  color: string // Couleur du badge pour l'affichage
  icon: string // Nom de l'icône Lucide
}

export interface SponsorshipStats {
  as_sponsor_count: number
  as_sponsored: boolean
  highest_badge: BadgeLevel | null
  total_films_given: number
}

// ============================================================================
// CONSTANTES POUR LES BADGES
// ============================================================================

export const BADGE_THRESHOLDS = {
  bronze: { min: 1, max: 5 },
  silver: { min: 6, max: 15 },
  gold: { min: 16, max: Infinity },
} as const

export const BADGE_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
} as const

export const BADGE_DISPLAY_NAMES = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
} as const
