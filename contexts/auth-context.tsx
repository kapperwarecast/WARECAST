"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isSigningOut: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, metadata?: { nom?: string; prenom?: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Fonction pour récupérer le profil utilisateur
  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    setProfile(profile)
  }, [supabase])

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session?.user && !error) {
        setSession(session)
        setUser(session.user)
        await fetchProfile(session.user.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.id || 'no user')

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        // Reset signing out state when sign out is complete
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] Sign out complete, resetting states')
          setIsSigningOut(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchProfile])

  // Connexion
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (_error) {
      return { error: "Une erreur inattendue s'est produite" }
    }
  }

  // Inscription
  const signUp = async (email: string, password: string, metadata?: { nom?: string; prenom?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (_error) {
      return { error: "Une erreur inattendue s'est produite" }
    }
  }

  // Déconnexion
  const signOut = useCallback(async () => {
    try {
      console.log('[AuthContext] Starting sign out process')
      setIsSigningOut(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] Sign out error:', error)
        setIsSigningOut(false)
        throw error
      }

      console.log('[AuthContext] Sign out request successful, waiting for auth state change')
      // Ne pas mettre à jour l'état manuellement ici
      // Laisser onAuthStateChange gérer la mise à jour de l'état
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la déconnexion:', error)
      setIsSigningOut(false)
      throw error
    }
  }, [supabase.auth])

  // Récupération de mot de passe
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (_error) {
      return { error: "Une erreur inattendue s'est produite" }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isSigningOut,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}