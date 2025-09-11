"use client"

import { useEffect, useState } from "react"
import { ListFilter, Search, Plus, User, LogIn, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFiltersModal } from "@/contexts/filters-context"
import { useSidebar } from "@/contexts/sidebar-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Image from "next/image"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { openFiltersModal, hasActiveFilters } = useFiltersModal()
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setProfile(profile)
      }
      
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          
          // Get user profile
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
          
          setProfile(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const displayName = profile ? 
    `${profile.prenom || ''} ${profile.nom || ''}`.trim() || profile.username :
    user?.email?.split('@')[0]

  const initials = profile && (profile.prenom || profile.nom) ? 
    `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase() :
    user?.email?.[0]?.toUpperCase()

  const handleCloseAndGoHome = () => {
    closeSidebar()
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-zinc-800">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-warecast.png"
              alt="Warecast"
              width={225}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Center - Filter & Search */}
          {user && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={hasActiveFilters 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }
                aria-label="Filter"
                onClick={openFiltersModal}
              >
                <ListFilter className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Right side - Always show + button */}
          <div className="flex items-center gap-2">
            {/* Bouton + toujours visible */}
            <Button
              variant="ghost"
              size="icon"
              className={sidebarOpen 
                ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800 z-50 relative" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800 z-50 relative"
              }
              aria-label={sidebarOpen ? "Fermer le menu et retourner au catalogue" : "Ouvrir le menu"}
              onClick={sidebarOpen ? handleCloseAndGoHome : openSidebar}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>

            {/* Bouton connexion seulement si pas connecté */}
            {!user && !loading && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Connexion
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        user={user}
        profile={profile}
        displayName={displayName}
        initials={initials}
      />
    </nav>
  )
}