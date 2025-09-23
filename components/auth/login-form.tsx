"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthErrorHandler } from "@/components/auth/auth-error-handler"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
    } else {
      router.push(redirectTo)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-900 border-zinc-800">
      <CardHeader className="text-center">
        <CardTitle className="text-white">Connexion</CardTitle>
        <CardDescription className="text-zinc-400">
          Connectez-vous à votre compte Warecast
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        
        <div className="mt-4 space-y-3">
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-zinc-400 hover:text-white text-sm hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              Pas encore de compte ?{" "}
              <Link
                href="/auth/signup"
                className="text-white hover:underline font-medium"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}