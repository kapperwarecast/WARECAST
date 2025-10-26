"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-zinc-800 p-4 rounded-full">
                  <XCircle className="h-16 w-16 text-zinc-400" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">
                Paiement annulé
              </CardTitle>
              <p className="text-zinc-400">
                Vous avez annulé le processus de souscription
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-800 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Que s&apos;est-il passé ?</h3>
                <p className="text-zinc-300">
                  Aucun paiement n&apos;a été effectué. Vous pouvez réessayer à tout moment.
                </p>
                <p className="text-zinc-400 text-sm">
                  Si vous avez rencontré un problème, n&apos;hésitez pas à nous contacter pour obtenir de l&apos;aide.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/formules">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Réessayer
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-zinc-600">
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
