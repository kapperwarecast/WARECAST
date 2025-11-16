"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupportType } from "@/types/deposit"

interface DepositFormProps {
  onSuccess?: (trackingNumber: string) => void
}

export function DepositForm({ onSuccess }: DepositFormProps) {
  const [filmTitle, setFilmTitle] = useState("")
  const [supportType, setSupportType] = useState<SupportType>("Blu-ray")
  const [tmdbId, setTmdbId] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    trackingNumber: string
    depositId: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/deposits/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filmTitle,
          supportType,
          tmdbId: tmdbId ? parseInt(tmdbId) : null,
          additionalNotes: additionalNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du dépôt")
      }

      if (data.success) {
        setSuccess({
          trackingNumber: data.tracking_number,
          depositId: data.deposit_id,
        })
        // Reset form
        setFilmTitle("")
        setTmdbId("")
        setAdditionalNotes("")
        setSupportType("Blu-ray")

        onSuccess?.(data.tracking_number)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-950/20 border border-green-800/30 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          Dépôt enregistré !
        </h3>
        <p className="text-zinc-400 mb-6">
          Votre dépôt a été enregistré avec succès. Vous pouvez maintenant
          envoyer votre film à notre adresse.
        </p>
        <div className="bg-black/40 rounded-lg p-4 mb-6">
          <p className="text-sm text-zinc-500 mb-2">Numéro de suivi</p>
          <p className="text-2xl font-mono font-bold text-white">
            {success.trackingNumber}
          </p>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Notez ce numéro ou imprimez-le pour l&apos;inclure dans votre colis.
          Vous le retrouverez aussi dans votre espace personnel.
        </p>
        <Button
          onClick={() => setSuccess(null)}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          Créer un autre dépôt
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold text-white">
            Créer un dépôt
          </h3>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-800/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Film Title */}
          <div className="space-y-2">
            <Label htmlFor="filmTitle" className="text-white">
              Titre du film *
            </Label>
            <Input
              id="filmTitle"
              type="text"
              value={filmTitle}
              onChange={(e) => setFilmTitle(e.target.value)}
              placeholder="Ex: Inception"
              required
              className="bg-black border-zinc-700 text-white"
            />
          </div>

          {/* Support Type */}
          <div className="space-y-2">
            <Label className="text-white">Type de support *</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSupportType("Blu-ray")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg border-2 transition-all",
                  supportType === "Blu-ray"
                    ? "border-blue-500 bg-blue-950/30 text-blue-400"
                    : "border-zinc-700 bg-black text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="font-semibold">Blu-ray</div>
                <div className="text-xs mt-1">(Recommandé)</div>
              </button>
              <button
                type="button"
                onClick={() => setSupportType("DVD")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg border-2 transition-all",
                  supportType === "DVD"
                    ? "border-purple-500 bg-purple-950/30 text-purple-400"
                    : "border-zinc-700 bg-black text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="font-semibold">DVD</div>
                <div className="text-xs mt-1">(Standard)</div>
              </button>
            </div>
          </div>

          {/* TMDB ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="tmdbId" className="text-white">
              ID TMDB (optionnel)
            </Label>
            <Input
              id="tmdbId"
              type="number"
              value={tmdbId}
              onChange={(e) => setTmdbId(e.target.value)}
              placeholder="Ex: 27205"
              className="bg-black border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500">
              Si vous connaissez l&apos;ID TMDB du film, cela facilitera son
              identification
            </p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Notes complémentaires (optionnel)
            </Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Ex: Version Director's Cut, édition spéciale..."
              rows={3}
              className="bg-black border-zinc-700 text-white resize-none"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <Button
            type="submit"
            disabled={loading || !filmTitle}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Créer le dépôt
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Prochaines étapes :</strong> Après avoir créé votre dépôt,
          imprimez ou notez le numéro de suivi et incluez-le dans votre colis.
          Envoyez ensuite votre film à l&apos;adresse indiquée ci-dessus.
        </p>
      </div>
    </form>
  )
}
