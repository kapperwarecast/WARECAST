"use client"

import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Gestion des utilisateurs
          </h1>
          <p className="text-zinc-400">
            Liste complète des utilisateurs, leurs abonnements et statistiques
          </p>
        </div>

        <UsersTable />
      </div>
    </main>
  )
}
