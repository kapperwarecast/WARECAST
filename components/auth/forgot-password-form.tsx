"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthErrorHandler } from "@/components/auth/auth-error-handler"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { resetPassword } = useAuth()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError(resetError)
    } else {
      setSuccess(true)
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-900/20 border border-green-800">
              <Mail className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <CardTitle className="text-white">Email envoyé</CardTitle>
          <CardDescription className="text-zinc-400">
            Un email de récupération a été envoyé à votre adresse email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center text-zinc-400 text-sm">
              <p>Vérifiez votre boîte de réception et cliquez sur le lien dans l&apos;email pour réinitialiser votre mot de passe.</p>
              <p className="mt-2">L&apos;email peut prendre quelques minutes à arriver.</p>
            </div>

            <div className="pt-4">
              <Button
                asChild
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-900 border-zinc-800">
      <CardHeader className="text-center">
        <CardTitle className="text-white">Mot de passe oublié</CardTitle>
        <CardDescription className="text-zinc-400">
          Entrez votre email pour recevoir un lien de récupération
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <AuthErrorHandler error={error} onDismiss={() => setError(null)} />

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isLoading ? "Envoi..." : "Envoyer le lien de récupération"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}