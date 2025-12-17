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
import { Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"

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
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Warecast</h1>
              <p className="text-sm text-zinc-400 mt-2">
                Votre plateforme d&apos;échange de films
              </p>
            </div>

            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Mot de passe mis à jour !
              </h2>
              <p className="text-zinc-400 mb-4">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="text-sm text-zinc-500">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Warecast</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Votre plateforme d&apos;échange de films
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">
            Nouveau mot de passe
          </h2>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600"
                  placeholder="Minimum 8 caractères"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-300">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600"
                  placeholder="Retapez votre mot de passe"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

            {/* Conseils de sécurité */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-400 font-medium mb-2">
                Conseils pour un mot de passe sécurisé :
              </p>
              <ul className="text-sm text-blue-400/80 space-y-1">
                <li>• Minimum 8 caractères</li>
                <li>• Mélangez lettres et chiffres</li>
                <li>• Évitez les mots du dictionnaire</li>
                <li>• Utilisez un mot de passe unique</li>
              </ul>
            </div>

            {/* Bouton submit */}
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200"
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
