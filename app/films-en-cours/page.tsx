'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Page de redirection - Films en cours (DEPRECATED)
 * Redirige automatiquement vers Ma Collection
 *
 * Cette page est conservée pour la compatibilité avec les anciens liens
 * mais le système de location a été remplacé par le système de propriété
 */
export default function FilmsEnCoursPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirection automatique vers Ma Collection
    router.replace('/ma-collection')
  }, [router])

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-zinc-400">Redirection vers Ma Collection...</p>
          </div>
        </div>
      </div>
    </main>
  )
}