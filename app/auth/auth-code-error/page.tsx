"use client"

import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black">Warecast</h1>
            <p className="text-sm text-gray-600 mt-2">
              Votre plateforme d&apos;échange de films
            </p>
          </div>

          {/* Contenu de l'erreur */}
          <div className="text-center mb-8">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold text-black mb-3">
              Lien invalide ou expiré
            </h2>
            <p className="text-gray-600 mb-2">
              Le lien de confirmation que vous avez utilisé est invalide ou a expiré.
            </p>
            <p className="text-sm text-gray-500">
              Les liens de confirmation expirent après 24 heures pour des raisons
              de sécurité.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Que faire maintenant ?
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Demandez un nouveau lien de confirmation</li>
                <li>Vérifiez que vous avez cliqué sur le bon lien</li>
                <li>Assurez-vous que le lien n&apos;a pas été tronqué par votre client email</li>
              </ul>
            </div>

            <Button
              asChild
              className="w-full bg-black hover:bg-gray-800"
            >
              <Link href="/auth/signup">
                Créer un nouveau compte
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/auth/forgot-password">
                Réinitialiser mon mot de passe
              </Link>
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-black underline"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Besoin d&apos;aide ?{" "}
              <Link
                href="/contact"
                className="text-black hover:underline font-medium"
              >
                Contactez notre support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
