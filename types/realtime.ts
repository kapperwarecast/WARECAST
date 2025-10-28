import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Configuration pour un listener Realtime
 */
export interface RealtimeListenerConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema: string
  table: string
  filter?: string
}

/**
 * Handler pour les changements Realtime
 */
export type RealtimeChangeHandler<T extends Record<string, unknown> = Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void

/**
 * Configuration complète pour useRealtimeSubscription
 */
export interface RealtimeSubscriptionConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  channelName: string
  listeners: Array<{
    config: RealtimeListenerConfig
    handler: RealtimeChangeHandler<T>
  }>
  initialStateFetcher?: () => Promise<void>
  onSubscribed?: () => void
  onError?: (error: Error) => void
}

/**
 * Retour du hook useRealtimeMovieAvailability
 */
export interface UseRealtimeMovieAvailabilityReturn {
  copiesDisponibles: number | null
  totalRentals: number | null
  loading: boolean
}
