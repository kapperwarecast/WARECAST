'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { RealtimeListenerConfig, RealtimeChangeHandler } from '@/types'

interface RealtimeListener {
  config: RealtimeListenerConfig
  handler: RealtimeChangeHandler
}

interface UseRealtimeSubscriptionOptions {
  channelName: string
  listeners: RealtimeListener[]
  initialStateFetcher?: () => Promise<void>
  onSubscribed?: () => void
  onError?: (error: Error) => void
  enabled?: boolean
}

/**
 * Hook générique pour s'abonner aux changements Realtime de Supabase
 * Factorise toute la logique commune de subscription
 *
 * @example
 * ```ts
 * useRealtimeSubscription({
 *   channelName: 'user-rentals',
 *   listeners: [
 *     {
 *       config: { event: 'INSERT', schema: 'public', table: 'emprunts', filter: 'user_id=eq.123' },
 *       handler: (payload) => console.log('New rental', payload)
 *     }
 *   ],
 *   initialStateFetcher: async () => { return },
 *   onSubscribed: () => console.log('Subscribed!'),
 * })
 * ```
 */
export function useRealtimeSubscription({
  channelName,
  listeners,
  initialStateFetcher,
  onSubscribed,
  onError,
  enabled = true,
}: UseRealtimeSubscriptionOptions): void {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const supabase = createClient()

    // Fetch initial state if provided
    if (initialStateFetcher) {
      initialStateFetcher().catch((error) => {
        console.error(`[Realtime ${channelName}] Error fetching initial state:`, error)
        onError?.(error)
      })
    }

    // Create channel
    let realtimeChannel = supabase.channel(channelName)

    // Add all listeners
    listeners.forEach(({ config, handler }) => {
      realtimeChannel = realtimeChannel.on(
        'postgres_changes' as any,
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter,
        },
        handler
      )
    })

    // Subscribe to channel
    realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [Realtime] Subscribed to ${channelName}`)
        onSubscribed?.()
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error(`Channel error for ${channelName}`)
        console.error(`❌ [Realtime] ${error.message}`)
        onError?.(error)
      }
    })

    setChannel(realtimeChannel)

    // Cleanup
    return () => {
      console.log(`🔌 [Realtime] Unsubscribing from ${channelName}`)
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [channelName, enabled, JSON.stringify(listeners.map(l => l.config))])
}
