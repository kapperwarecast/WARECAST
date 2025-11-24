'use client'

import { FilmsCatalogueTable } from '@/components/admin/films-catalogue-table'

export default function AdminFilmsCataloguePage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Catalogue de films
          </h1>
          <p className="text-zinc-400">
            Liste complète des 413 films disponibles dans la base de données
          </p>
        </div>

        <FilmsCatalogueTable />
      </div>
    </main>
  )
}
