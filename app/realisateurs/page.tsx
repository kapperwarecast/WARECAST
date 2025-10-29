import { DirectorsPageClient } from "@/components/directors-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Réalisateurs | Warecast",
  description: "Découvrez tous les réalisateurs disponibles sur Warecast",
}

export default function RealisateursPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Réalisateurs</h1>
        <DirectorsPageClient />
      </div>
    </main>
  )
}
