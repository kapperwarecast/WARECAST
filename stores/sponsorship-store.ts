"use client"

import { createClient } from "@/lib/supabase/client"
import {
  MySponsor,
  MySponsoredUser,
  UserBadge,
  BadgeLevel,
} from "@/types/sponsorship"
import { createCachedStore, BaseCachedStore } from "./create-cached-store"

// ============================================================================
// TYPES
// ============================================================================

interface SponsorshipData {
  sponsor: MySponsor | null // Mon parrain (si j'ai été parrainé)
  sponsoredUsers: MySponsoredUser[] // Mes filleuls (si j'ai parrainé)
  badges: UserBadge[] // Mes badges de parrainage
  highestBadge: BadgeLevel | null
}

interface SponsorshipState extends BaseCachedStore<SponsorshipData> {
  // Getters
  hasBeenSponsored: () => boolean
  hasSponsoredUsers: () => boolean
  getSponsoredCount: () => number
  getHighestBadge: () => BadgeLevel | null
  hasBadge: (level: BadgeLevel) => boolean

  // Actions spécifiques
  refreshSponsorship: (userId: string) => Promise<void>
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchSponsorshipData(
  userId: string | null
): Promise<SponsorshipData> {
  if (!userId) {
    return {
      sponsor: null,
      sponsoredUsers: [],
      badges: [],
      highestBadge: null,
    }
  }

  const supabase = createClient()

  // Fetch en parallèle de toutes les données de parrainage
  const [sponsorResult, sponsoredUsersResult, badgesResult, highestBadgeResult] =
    await Promise.all([
      supabase.rpc("get_my_sponsor", { p_user_id: userId }),
      supabase.rpc("get_my_sponsored_users", { p_user_id: userId }),
      supabase.rpc("get_user_badges", { p_user_id: userId }),
      supabase.rpc("get_user_highest_badge", { p_user_id: userId }),
    ])

  if (sponsorResult.error) {
    console.error("Error fetching sponsor:", sponsorResult.error)
  }

  if (sponsoredUsersResult.error) {
    console.error("Error fetching sponsored users:", sponsoredUsersResult.error)
  }

  if (badgesResult.error) {
    console.error("Error fetching badges:", badgesResult.error)
  }

  if (highestBadgeResult.error) {
    console.error("Error fetching highest badge:", highestBadgeResult.error)
  }

  // Type cast sponsor data badge_awarded de string vers BadgeLevel
  const rawSponsor = sponsorResult.data?.[0]
  const sponsor: MySponsor | null = rawSponsor
    ? {
        ...rawSponsor,
        badge_awarded: (rawSponsor.badge_awarded as BadgeLevel) || null,
      }
    : null

  // Type cast badges badge_level de string vers BadgeLevel
  const badges: UserBadge[] = (badgesResult.data || []).map((badge) => ({
    ...badge,
    badge_level: badge.badge_level as BadgeLevel,
  }))

  return {
    sponsor,
    sponsoredUsers: sponsoredUsersResult.data || [],
    badges,
    highestBadge: (highestBadgeResult.data as BadgeLevel) || null,
  }
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useSponsorshipStore = createCachedStore<
  SponsorshipData,
  SponsorshipState
>({
  name: "sponsorship-store",
  cacheDuration: 10 * 60 * 1000, // 10 minutes (données rarement modifiées)
  partializeFields: ["data", "lastFetch", "currentUserId"],

  initialState: () => ({
    sponsor: null,
    sponsoredUsers: [],
    badges: [],
    highestBadge: null,
  }),

  fetchData: fetchSponsorshipData,

  storeActions: (set, get) => ({
    // Getters
    hasBeenSponsored: () => {
      return get().data.sponsor !== null
    },

    hasSponsoredUsers: () => {
      return get().data.sponsoredUsers.length > 0
    },

    getSponsoredCount: () => {
      return get().data.sponsoredUsers.length
    },

    getHighestBadge: () => {
      return get().data.highestBadge
    },

    hasBadge: (level: BadgeLevel) => {
      return get().data.badges.some((badge) => badge.badge_level === level)
    },

    // Actions
    refreshSponsorship: async (userId: string) => {
      await get().fetchData(userId)
    },
  }),

  onFetchSuccess: (data) => {
    const hasBeenSponsored = data.sponsor !== null
    const sponsoredCount = data.sponsoredUsers.length
    const badge = data.highestBadge

    console.log(
      `Sponsorship loaded - Been sponsored: ${hasBeenSponsored}, Sponsored: ${sponsoredCount}, Highest badge: ${badge || "none"}`
    )
  },

  onFetchError: (error) => {
    console.error("Failed to load sponsorship data:", error)
  },
})
