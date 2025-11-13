"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "Le mot de passe doit contenir des lettres et des chiffres"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        console.error("Erreur de mise à jour du mot de passe:", updateError)
        setError(
          "Impossible de mettre à jour votre mot de passe. Veuillez réessayer."
        )
        setIsLoading(false)
        return
      }

      // Succès
      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (err) {
      console.error("Erreur inattendue:", err)
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black">Warecast</h1>
              <p className="text-sm text-gray-600 mt-2">
                Votre plateforme de location de films
              </p>
            </div>

            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold text-black mb-2">
                Mot de passe mis à jour !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="text-sm text-gray-500">
                Redirection vers la page de connexion...
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black">Warecast</h1>
            <p className="text-sm text-gray-600 mt-2">
              Votre plateforme de location de films
            </p>
          </div>

          <h2 className="text-2xl font-bold text-black mb-6">
            Nouveau mot de passe
          </h2>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div>
              <Label htmlFor="password" className="text-black">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  placeholder="Minimum 8 caractères"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <Label htmlFor="confirmPassword" className="text-black">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pr-10"
                  placeholder="Retapez votre mot de passe"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Conseils de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900 font-medium mb-1">
                Conseils pour un mot de passe sécurisé :
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Minimum 8 caractères</li>
                <li>Mélangez lettres et chiffres</li>
                <li>Évitez les mots du dictionnaire</li>
                <li>Utilisez un mot de passe unique</li>
              </ul>
            </div>

            {/* Bouton submit */}
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
