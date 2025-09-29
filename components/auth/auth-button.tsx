"use client"

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
  const { signOut, isSigningOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      console.log('[AuthButton] Starting logout process')
      await signOut()
      // Redirection immédiate vers la page de connexion
      router.push("/auth/login")
      router.refresh()
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