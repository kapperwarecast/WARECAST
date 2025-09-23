"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthErrorHandlerProps {
  error: string | null
  onDismiss?: () => void
}

export function AuthErrorHandler({ error, onDismiss }: AuthErrorHandlerProps) {
  if (!error) return null

  // Traduction des messages d'erreur courants
  const getLocalizedError = (error: string) => {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Email ou mot de passe incorrect",
      "Email not confirmed": "Votre email n'est pas encore confirmé. Vérifiez votre boîte de réception.",
      "Too many requests": "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.",
      "User already registered": "Un compte avec cet email existe déjà",
      "Weak password": "Le mot de passe doit contenir au moins 6 caractères",
      "Invalid email": "Format d'email invalide",
      "User not found": "Aucun compte trouvé avec cet email",
      "Email address not authorized": "Cette adresse email n'est pas autorisée",
      "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
      "signups not allowed": "Les inscriptions ne sont pas autorisées actuellement",
      "Token has expired or is invalid": "Le lien de récupération a expiré ou est invalide"
    }

    return errorMap[error] || error
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{getLocalizedError(error)}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}