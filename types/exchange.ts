import { Tables } from "@/lib/supabase/types"

// ============================================================================
// TYPES DE BASE (depuis Supabase)
// ============================================================================

export type FilmExchange = Tables<"film_exchanges">

// ============================================================================
// TYPES ENRICHIS (avec relations)
// ============================================================================

export interface FilmExchangeWithDetails extends FilmExchange {
  initiator: {
    id: string
    username: string | null
    email?: string
  }
  recipient: {
    id: string
    username: string | null
    email?: string
  }
  film_offered: {
    id: string
    movie_title: string
    physical_support_type: string
    poster_path: string | null
  }
  film_requested: {
    id: string
    movie_title: string
    physical_support_type: string
    poster_path: string | null
  }
  payment?: {
    id: string
    amount: number
    status: string
  } | null
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export type ExchangeStatus =
  | "pending"    // En attente de réponse du destinataire
  | "accepted"   // Accepté, en cours de transfert
  | "refused"    // Refusé par le destinataire
  | "cancelled"  // Annulé par l'initiateur
  | "completed"  // Transfert effectué

// ============================================================================
// TYPES DE RÉPONSE RPC
// ============================================================================

export interface ProposeExchangeResponse {
  success: boolean
  exchange_id?: string
  requires_payment?: boolean
  amount?: number
  offered_film_title?: string
  requested_film_title?: string
  message: string
  error?: string
}

export interface AcceptExchangeResponse {
  success: boolean
  exchange_id?: string
  offered_film_title?: string
  requested_film_title?: string
  message: string
  error?: string
}

export interface RefuseExchangeResponse {
  success: boolean
  exchange_id?: string
  message: string
  error?: string
}

export interface CancelExchangeResponse {
  success: boolean
  exchange_id?: string
  message: string
  error?: string
}

export interface PendingExchangeRequest {
  exchange_id: string
  initiator_email: string
  offered_film_title: string
  requested_film_title: string
  proposed_at: string
}

export interface PendingExchangeProposal {
  exchange_id: string
  recipient_email: string
  offered_film_title: string
  requested_film_title: string
  proposed_at: string
}

// ============================================================================
// TYPES POUR L'UI
// ============================================================================

export interface ExchangeCardData {
  exchange_id: string
  status: ExchangeStatus
  is_initiator: boolean // true si l'utilisateur actuel est l'initiateur
  other_user_name: string | null
  offered_film: {
    title: string
    poster_path: string | null
    support_type: string
  }
  requested_film: {
    title: string
    poster_path: string | null
    support_type: string
  }
  proposed_date: Date
  requires_payment: boolean
  payment_amount?: number
}

export interface ExchangeStats {
  total_exchanges: number
  pending_requests: number // Demandes reçues en attente
  pending_proposals: number // Propositions envoyées en attente
  completed_exchanges: number
  refused_exchanges: number
}

export interface ExchangeFilters {
  status?: ExchangeStatus[]
  date_from?: Date
  date_to?: Date
  search_query?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const EXCHANGE_STATUS_LABELS = {
  pending: "En attente",
  accepted: "Accepté",
  refused: "Refusé",
  cancelled: "Annulé",
  completed: "Terminé",
} as const

export const EXCHANGE_STATUS_COLORS = {
  pending: "text-yellow-500",
  accepted: "text-blue-500",
  refused: "text-red-500",
  cancelled: "text-gray-500",
  completed: "text-green-500",
} as const

// Prix de l'échange pour les non-abonnés (selon CGU Art. 4.2)
export const EXCHANGE_PRICE_NON_SUBSCRIBER = 1.5 // en euros
