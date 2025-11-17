"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw } from "lucide-react"

interface ResumeModalProps {
  /** Position de lecture en secondes */
  position: number
  /** Durée totale en secondes */
  duration: number
  /** Callback quand l'utilisateur choisit de reprendre */
  onResume: () => void
  /** Callback quand l'utilisateur choisit de recommencer */
  onRestart: () => void
}

/**
 * Formate un nombre de secondes en format MM:SS ou HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Modale de reprise de lecture vidéo
 *
 * Affiche deux options :
 * - Reprendre à la dernière position
 * - Recommencer depuis le début
 */
export function ResumeModal({ position, duration, onResume, onRestart }: ResumeModalProps) {
  const [open, setOpen] = useState(true)

  // Calculer le pourcentage de progression
  const percentage = Math.min(100, (position / duration) * 100)

  const handleResume = () => {
    setOpen(false)
    onResume()
  }

  const handleRestart = () => {
    setOpen(false)
    onRestart()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Reprendre la lecture</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Vous avez déjà regardé ce film. Souhaitez-vous reprendre où vous vous êtes arrêté ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Dernière position :</span>
              <span className="text-white font-semibold">{formatTime(position)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Progression :</span>
              <span className="text-white font-semibold">{percentage.toFixed(0)}%</span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-zinc-700 rounded-full h-2 mt-3">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recommencer à 00:00
          </Button>
          <Button
            onClick={handleResume}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Reprendre à {formatTime(position)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
