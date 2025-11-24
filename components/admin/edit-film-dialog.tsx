'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Movie {
  id: string
  titre_francais: string
  titre_original: string
  lien_vimeo: string | null
  synopsis: string | null
  annee_sortie: number
  duree: number
  statut: string
}

interface EditFilmDialogProps {
  film: Movie | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilmUpdated: () => void
}

export function EditFilmDialog({
  film,
  open,
  onOpenChange,
  onFilmUpdated,
}: EditFilmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titre_francais: '',
    titre_original: '',
    lien_vimeo: '',
    synopsis: '',
    annee_sortie: 0,
    duree: 0,
    statut: 'en ligne',
  })

  useEffect(() => {
    if (film) {
      setFormData({
        titre_francais: film.titre_francais || '',
        titre_original: film.titre_original || '',
        lien_vimeo: film.lien_vimeo || '',
        synopsis: film.synopsis || '',
        annee_sortie: film.annee_sortie || 0,
        duree: film.duree || 0,
        statut: film.statut || 'en ligne',
      })
    }
  }, [film])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!film) return

    try {
      setIsSubmitting(true)
      setError(null)

      const res = await fetch(`/api/admin/films/${film.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      onFilmUpdated()
    } catch (err) {
      console.error('[EditFilmDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!film) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Éditer le film</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Modifiez les informations du film
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titre_francais" className="text-white">
                Titre français
              </Label>
              <Input
                id="titre_francais"
                value={formData.titre_francais}
                onChange={(e) =>
                  setFormData({ ...formData, titre_francais: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titre_original" className="text-white">
                Titre original
              </Label>
              <Input
                id="titre_original"
                value={formData.titre_original}
                onChange={(e) =>
                  setFormData({ ...formData, titre_original: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lien_vimeo" className="text-white">
              Lien Vimeo
            </Label>
            <Input
              id="lien_vimeo"
              type="url"
              placeholder="https://player.vimeo.com/video/..."
              value={formData.lien_vimeo}
              onChange={(e) =>
                setFormData({ ...formData, lien_vimeo: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis" className="text-white">
              Synopsis
            </Label>
            <textarea
              id="synopsis"
              rows={4}
              value={formData.synopsis}
              onChange={(e) =>
                setFormData({ ...formData, synopsis: e.target.value })
              }
              className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annee_sortie" className="text-white">
                Année de sortie
              </Label>
              <Input
                id="annee_sortie"
                type="number"
                value={formData.annee_sortie}
                onChange={(e) =>
                  setFormData({ ...formData, annee_sortie: parseInt(e.target.value) })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duree" className="text-white">
                Durée (min)
              </Label>
              <Input
                id="duree"
                type="number"
                value={formData.duree}
                onChange={(e) =>
                  setFormData({ ...formData, duree: parseInt(e.target.value) })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut" className="text-white">
                Statut
              </Label>
              <Select
                value={formData.statut}
                onValueChange={(value) =>
                  setFormData({ ...formData, statut: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="en ligne" className="text-white">
                    En ligne
                  </SelectItem>
                  <SelectItem value="en traitement" className="text-white">
                    En traitement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
