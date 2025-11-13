"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

function SecurityContent() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb / Navigation */}
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Link>
          </Button>
        </div>

        {/* Titre de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sécurité</h1>
          <p className="text-zinc-400">
            Gérez les paramètres de sécurité de votre compte
          </p>
        </div>

        {/* Formulaire de changement de mot de passe */}
        <ChangePasswordForm />
      </div>
    </main>
  )
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <SecurityContent />
    </ProtectedRoute>
  )
}
