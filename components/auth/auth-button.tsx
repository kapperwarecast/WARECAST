"use client"

import { useState } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    await signOut()

    router.push("/")
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "..." : "Déconnexion"}
    </Button>
  )
}