"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"

const changePasswordSchema = z
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

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordForm) => {
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
      reset()

      // Réinitialiser l'état de succès après 5 secondes
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err) {
      console.error("Erreur inattendue:", err)
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Changer le mot de passe</CardTitle>
        <CardDescription className="text-zinc-400">
          Mettez à jour votre mot de passe pour sécuriser votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium">
                  Mot de passe mis à jour !
                </p>
                <p className="text-green-400/80 text-sm mt-1">
                  Votre mot de passe a été modifié avec succès.
                </p>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}
