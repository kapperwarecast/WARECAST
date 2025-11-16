import { Tables } from "@/lib/supabase/types"

// ============================================================================
// TYPES DE BASE (depuis Supabase)
// ============================================================================

export type FilmDeposit = Tables<"film_deposits">

// ============================================================================
// TYPES ENRICHIS (avec relations)
// ============================================================================

export interface FilmDepositWithDetails extends FilmDeposit {
  user: {
    id: string
    username: string | null
    email?: string
  }
  processed_by_admin?: {
    id: string
    username: string | null
    email?: string
  } | null
  movie?: {
    id: string
    titre_francais: string | null
    poster_local_path: string | null
  } | null
  registry?: {
    id: string
    current_owner_id: string
  } | null
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export type DepositStatus =
  | "sent"        // Envoyé par l'utilisateur
  | "received"    // Réceptionné par l'admin
  | "digitizing"  // En cours de numérisation
  | "completed"   // Finalisé et ajouté au registre
  | "rejected"    // Refusé (état défectueux, contenu non conforme, etc.)

export type SupportType = "Blu-ray" | "DVD"

// ============================================================================
// TYPES DE RÉPONSE RPC
// ============================================================================

export interface CreateDepositResponse {
  success: boolean
  deposit_id?: string
  tracking_number?: string
  message: string
  error?: string
}

export interface AdminDepositResponse {
  success: boolean
  deposit_id?: string
  registry_id?: string
  message: string
  error?: string
}

export interface UserDeposit {
  deposit_id: string
  tracking_number: string
  film_title: string
  support_type: SupportType
  status: DepositStatus
  sent_at: string
  received_at: string | null
  completed_at: string | null
  rejection_reason: string | null
}

export interface AdminPendingDeposit {
  deposit_id: string
  tracking_number: string
  user_email: string
  film_title: string
  support_type: SupportType
  status: DepositStatus
  sent_at: string
  additional_notes: string | null
}

// ============================================================================
// TYPES POUR L'UI
// ============================================================================

export interface DepositCardData {
  deposit_id: string
  tracking_number: string
  film_title: string
  support_type: SupportType
  status: DepositStatus
  sent_date: Date
  received_date?: Date | null
  completed_date?: Date | null
  rejection_reason?: string | null
  progress_percentage: number // 0-100 selon le statut
}

export interface DepositFormData {
  film_title: string
  support_type: SupportType
  tmdb_id?: number | null
  additional_notes?: string
}

export interface DepositStats {
  total_deposits: number
  by_status: {
    sent: number
    received: number
    digitizing: number
    completed: number
    rejected: number
  }
  average_processing_time_days?: number
}

export interface AdminDepositFilters {
  status?: DepositStatus[]
  date_from?: Date
  date_to?: Date
  search_query?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const DEPOSIT_STATUS_LABELS = {
  sent: "Envoyé",
  received: "Réceptionné",
  digitizing: "En cours de numérisation",
  completed: "Complété",
  rejected: "Refusé",
} as const

export const DEPOSIT_STATUS_COLORS = {
  sent: "text-blue-500",
  received: "text-yellow-500",
  digitizing: "text-purple-500",
  completed: "text-green-500",
  rejected: "text-red-500",
} as const

export const DEPOSIT_STATUS_PROGRESS = {
  sent: 25,
  received: 50,
  digitizing: 75,
  completed: 100,
  rejected: 0,
} as const

// Format du numéro de tracking : WC-YYYYMMDD-XXXXX
export const TRACKING_NUMBER_REGEX = /^WC-\d{8}-\d{5}$/

export const SUPPORT_TYPES: SupportType[] = ["Blu-ray", "DVD"]

// Raisons de rejet communes (pour l'admin)
export const COMMON_REJECTION_REASONS = [
  "Support défectueux (rayures, fissures)",
  "Contenu non conforme (copie pirate, non original)",
  "Film déjà présent dans le catalogue",
  "Qualité insuffisante",
  "Packaging incomplet ou endommagé",
  "Autre (voir notes)",
] as const
