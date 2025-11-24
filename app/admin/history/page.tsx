'use client'

import { HistoryTable } from '@/components/admin/history-table'

export default function AdminHistoryPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Historique des échanges
          </h1>
          <p className="text-zinc-400">
            Consultez l&apos;historique complet des transferts et échanges de films entre utilisateurs
          </p>
        </div>

        <HistoryTable />
      </div>
    </main>
  )
}
