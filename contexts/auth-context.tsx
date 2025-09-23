"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
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

  const supabase = createClient()

  // Fonction pour récupérer le profil utilisateur
  const fetchProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    setProfile(profile)
  }

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
      async (_event, session) => {
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
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
  const signOut = async () => {
    await supabase.auth.signOut()
  }

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