import { useAuth } from "@/contexts/auth-context"

/**
 * Hook pour centraliser la logique d'affichage des informations utilisateur
 */
export function useUserDisplay() {
  const { user, profile, loading, isSigningOut } = useAuth()

  // Pendant la déconnexion, éviter d'afficher des données obsolètes
  const isTransitioning = isSigningOut || (loading && !user)

  const displayName = (!isTransitioning && profile)
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() || profile.username
    : (!isTransitioning && user?.email?.split('@')[0]) || null

  const initials = (!isTransitioning && profile && (profile.prenom || profile.nom))
    ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase()
    : (!isTransitioning && user?.email?.[0]?.toUpperCase()) || null

  const greetingMessage = !isTransitioning
    ? (profile?.prenom
        ? `Bonjour ${profile.prenom}`
        : displayName
          ? `Bonjour ${displayName}`
          : 'Bonjour')
    : 'Bonjour'

  const fullName = (!isTransitioning && profile)
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim()
    : null

  return {
    user,
    profile,
    displayName,
    initials,
    greetingMessage,
    fullName,
    email: !isTransitioning ? user?.email : null,
    isAuthenticated: !!user && !isSigningOut,
    isLoading: loading,
    isSigningOut,
    isTransitioning
  }
}