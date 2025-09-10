"use client"

import { useEffect, useState } from "react"
import { ListFilter, Search, Plus, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AuthButton } from "@/components/auth/auth-button"
import { useFiltersModal } from "@/contexts/filters-context"
import { createClient } from "@/lib/supabase/client"
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-[1600px] mx-auto px-6">
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

          {/* Right side - Auth dependent */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  aria-label="Administration"
                >
                  <Link href="/admin">
                    <Plus className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      {initials ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-zinc-800 text-zinc-300 font-medium text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 w-56">
                    {displayName && (
                      <>
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium text-white">{displayName}</p>
                          <p className="text-xs text-zinc-400">{user.email}</p>
                        </div>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                      </>
                    )}
                    <DropdownMenuItem asChild className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                      <Link href="/profile">
                        <User className="h-4 w-4 mr-2" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem asChild className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800">
                      <div>
                        <AuthButton variant="ghost" size="sm" className="w-full justify-start p-0 h-auto font-normal text-zinc-300 hover:text-white hover:bg-transparent" />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
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
    </nav>
  )
}