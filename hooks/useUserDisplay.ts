import { useAuth } from "@/contexts/auth-context"

/**
 * Hook pour centraliser la logique d'affichage des informations utilisateur
 */
export function useUserDisplay() {
  const { user, profile } = useAuth()

  const displayName = profile
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() || profile.username
    : user?.email?.split('@')[0]

  const initials = profile && (profile.prenom || profile.nom)
    ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase()

  const greetingMessage = profile?.prenom
    ? `Bonjour ${profile.prenom}`
    : displayName
      ? `Bonjour ${displayName}`
      : 'Bonjour'

  const fullName = profile
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim()
    : null

  return {
    user,
    profile,
    displayName,
    initials,
    greetingMessage,
    fullName,
    email: user?.email,
    isAuthenticated: !!user
  }
}