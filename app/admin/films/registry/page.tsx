'use client'

import { FilmsRegistryTable } from '@/components/admin/films-registry-table'

export default function AdminFilmsRegistryPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Registre de propriété
          </h1>
          <p className="text-zinc-400">
            Liste complète des copies physiques et leur historique de propriété
          </p>
        </div>

        <FilmsRegistryTable />
      </div>
    </main>
  )
}
