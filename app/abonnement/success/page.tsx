"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"

function SuccessLoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Chargement...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Redirection automatique après 5 secondes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const sessionId = searchParams.get("session_id")

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border-orange-500">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-orange-500/20 p-4 rounded-full">
                  <CheckCircle className="h-16 w-16 text-orange-500" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">
                Abonnement activé !
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <span>Bienvenue dans Warecast Premium</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-800 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Votre abonnement est maintenant actif</h3>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Emprunts illimités de films</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Accès à tout le catalogue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Aucun frais supplémentaire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Renouvellement automatique</span>
                  </li>
                </ul>
              </div>

              {sessionId && (
                <div className="text-xs text-zinc-500 bg-zinc-800/50 p-3 rounded">
                  Session ID : {sessionId}
                </div>
              )}

              <div className="text-center text-zinc-400 text-sm">
                Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/">Explorer le catalogue</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-zinc-600">
                  <Link href="/profile">Voir mon profil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoadingFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
