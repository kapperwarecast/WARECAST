import { Tables } from "@/lib/supabase/types"

// ============================================================================
// TYPES DE BASE (depuis Supabase)
// ============================================================================

export type FilmRegistry = Tables<"films_registry">
export type OwnershipHistory = Tables<"ownership_history">

// ============================================================================
// TYPES ENRICHIS (avec relations)
// ============================================================================

export interface FilmRegistryWithMovie extends FilmRegistry {
  movie: {
    id: string
    titre_francais: string | null
    titre_original: string | null
    poster_local_path: string | null
    annee_sortie: number | null
    genres: string[] | null
  }
}

export interface FilmRegistryWithOwner extends FilmRegistry {
  current_owner: {
    id: string
    username: string | null
    email?: string
  }
  previous_owner?: {
    id: string
    username: string | null
    email?: string
  } | null
}

export interface FilmRegistryComplete extends FilmRegistry {
  movie: {
    id: string
    titre_francais: string | null
    titre_original: string | null
    poster_local_path: string | null
    annee_sortie: number | null
    genres: string[] | null
    duree: number | null
    synopsis: string | null
  }
  current_owner: {
    id: string
    username: string | null
    email?: string
  }
  previous_owner?: {
    id: string
    username: string | null
    email?: string
  } | null
}

export interface OwnershipHistoryWithOwners extends OwnershipHistory {
  from_owner?: {
    id: string
    username: string | null
    email?: string
  } | null
  to_owner: {
    id: string
    username: string | null
    email?: string
  }
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export type AcquisitionMethod =
  | "deposit"          // Dépôt initial par l'utilisateur
  | "exchange"         // Obtenu via un échange
  | "sponsorship"      // Reçu en tant que filleul
  | "redistribution"   // Redistribué après suppression de compte
  | "legacy_migration" // Migration depuis l'ancien système

export type TransferType =
  | "exchange"         // Échange bilatéral
  | "sponsorship"      // Don de parrainage
  | "redistribution"   // Redistribution automatique
  | "initial_deposit"  // Dépôt initial

export type PhysicalSupportType = "Blu-ray" | "DVD"

// ============================================================================
// TYPES DE RÉPONSE RPC
// ============================================================================

export interface UserFilm {
  registry_id: string
  movie_id: string
  movie_title: string
  physical_support_type: PhysicalSupportType
  acquisition_date: string
  acquisition_method: AcquisitionMethod
  deposit_date: string
}

export interface FilmOwner {
  owner_id: string
  owner_email: string
  acquisition_date: string
  acquisition_method: AcquisitionMethod
}

export interface OwnershipTransfer {
  transfer_id: string
  from_owner_email: string | null
  to_owner_email: string
  transfer_type: TransferType
  transfer_date: string
}

// ============================================================================
// TYPES POUR L'UI
// ============================================================================

export interface FilmCardData {
  registry_id: string
  movie_id: string
  title: string
  poster_path: string | null
  support_type: PhysicalSupportType
  acquisition_date: Date
  acquisition_method: AcquisitionMethod
  is_owned: boolean // true si l'utilisateur actuel possède ce film
}

export interface OwnershipStats {
  total_films: number
  by_support_type: {
    bluray: number
    dvd: number
  }
  by_acquisition_method: {
    deposit: number
    exchange: number
    sponsorship: number
    redistribution: number
    legacy_migration: number
  }
}
