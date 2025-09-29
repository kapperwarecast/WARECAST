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

  // Cache mémoire pour éviter les appels répétés
  const profileCache = useMemo(() => new Map<string, UserProfile>(), [])

  // Fonction pour récupérer le profil utilisateur (avec cache)
  const fetchProfile = useCallback(async (userId: string) => {
    // Vérifier le cache d'abord
    if (profileCache.has(userId)) {
      setProfile(profileCache.get(userId)!)
      return
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profile) {
      profileCache.set(userId, profile)
      setProfile(profile)
    }
  }, [supabase, profileCache])

  useEffect(() => {
    let subscription: any = null

    // Récupérer la session initiale de manière optimisée
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session?.user && !error) {
        setSession(session)
        setUser(session.user)
        // Charger le profil de manière asynchrone (non-bloquant)
        fetchProfile(session.user.id)
      }

      // Démarrage immédiat, le profil se chargera en arrière-plan
      setLoading(false)
    }

    getInitialSession()

    // Délai léger pour éviter le blocage initial
    const authTimer = setTimeout(() => {
      // Écouter les changements d'authentification
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[AuthContext] Auth state change:', event, session?.user?.id || 'no user')

          setSession(session)
          setUser(session?.user || null)

          if (session?.user) {
            fetchProfile(session.user.id)
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
      subscription = sub
    }, 50)

    return () => {
      clearTimeout(authTimer)
      subscription?.unsubscribe()
    }
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
      
      // Nettoyer immédiatement l'état local pour une UI réactive
      setUser(null)
      setProfile(null)
      setSession(null)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] Sign out error:', error)
        throw error
      }

      console.log('[AuthContext] Sign out completed successfully')
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la déconnexion:', error)
      throw error
    } finally {
      setIsSigningOut(false)
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