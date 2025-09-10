import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        <User className="w-24 h-24 text-zinc-600 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Personne introuvable</h1>
          <p className="text-zinc-400 text-lg">
            La personne que vous recherchez n'existe pas ou a été supprimée.
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild className="bg-zinc-800 hover:bg-zinc-700">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}