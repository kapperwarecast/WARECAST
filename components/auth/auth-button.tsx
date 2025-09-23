"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface AuthButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AuthButton({ variant = "ghost", size = "sm", className }: AuthButtonProps) {
  const { signOut, isSigningOut, user } = useAuth()
  const router = useRouter()

  // Rediriger vers la page d'accueil quand la déconnexion est terminée
  useEffect(() => {
    if (!user && !isSigningOut) {
      console.log('[AuthButton] User signed out, redirecting to home page')
      router.push("/")
    }
  }, [user, isSigningOut, router])

  const handleLogout = async () => {
    try {
      console.log('[AuthButton] Starting logout process')
      await signOut()
    } catch (error) {
      console.error('[AuthButton] Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isSigningOut}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isSigningOut ? "Déconnexion..." : "Déconnexion"}
    </Button>
  )
}