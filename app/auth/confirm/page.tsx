"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")
        const next = searchParams.get("next")

        if (!token_hash || !type) {
          setStatus("error")
          setMessage("Lien de confirmation invalide")
          setTimeout(() => router.push("/auth/auth-code-error"), 2000)
          return
        }

        const supabase = createClient()

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email" | "recovery",
        })

        if (error) {
          console.error("Erreur de confirmation:", error)
          setStatus("error")
          setMessage("Le lien de confirmation est invalide ou a expiré")
          setTimeout(() => router.push("/auth/auth-code-error"), 2000)
          return
        }

        // Succès
        setStatus("success")

        // Gestion des redirections selon le type
        if (type === "recovery" && next) {
          // Cas reset password : redirection immédiate vers la page de reset
          setMessage("Token validé, redirection...")
          setTimeout(() => router.push(next), 1000)
        } else if (type === "email") {
          // Cas confirmation email : message de succès puis redirection login
          setMessage("Email confirmé avec succès !")
          setTimeout(() => router.push("/auth/login"), 2000)
        } else {
          // Fallback : redirection vers login
          setMessage("Confirmation réussie !")
          setTimeout(() => router.push("/auth/login"), 2000)
        }
      } catch (err) {
        console.error("Erreur inattendue:", err)
        setStatus("error")
        setMessage("Une erreur s'est produite")
        setTimeout(() => router.push("/auth/auth-code-error"), 2000)
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black">Warecast</h1>
            <p className="text-sm text-gray-600 mt-2">
              Votre plateforme de location de films
            </p>
          </div>

          {/* Contenu dynamique selon le statut */}
          <div className="text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-black animate-spin" />
                <h2 className="text-xl font-semibold text-black mb-2">
                  Vérification en cours...
                </h2>
                <p className="text-gray-600">
                  Veuillez patienter pendant que nous confirmons votre email.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="text-xl font-semibold text-black mb-2">
                  {message}
                </h2>
                <p className="text-gray-600">Redirection en cours...</p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <h2 className="text-xl font-semibold text-black mb-2">
                  Erreur de confirmation
                </h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500">
                  Redirection vers la page d'erreur...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-black animate-spin" />
              <h2 className="text-xl font-semibold text-black">Chargement...</h2>
            </div>
          </div>
        </main>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
