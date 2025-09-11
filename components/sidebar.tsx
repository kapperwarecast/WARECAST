"use client"

import { Settings, User, HelpCircle, Film, Upload, Heart, Check, ShoppingCart, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AuthButton } from "@/components/auth/auth-button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type UserProfile = Tables<"user_profiles">

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: SupabaseUser | null
  profile: UserProfile | null
  displayName?: string
  initials?: string
}

export function Sidebar({ isOpen, onClose, user, profile, displayName, initials }: SidebarProps) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isAdminPage = pathname.startsWith('/admin')
  const isProfilePage = pathname === '/profile'
  const isHelpPage = pathname === '/help'
  const isSendMoviePage = pathname === '/send-movie'
  const isFavoritesPage = pathname === '/favorites'
  const isWatchedPage = pathname === '/watched'
  const isToWatchPage = pathname === '/to-watch'
  const isBuyMoviePage = pathname === '/buy-movie'
  const isAbonnementPage = pathname === '/abonnement'
  
  const greetingMessage = profile?.prenom 
    ? `Bonjour ${profile.prenom}` 
    : displayName 
      ? `Bonjour ${displayName}` 
      : 'Bonjour'
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-screen w-80 bg-zinc-900 border-l border-zinc-800 z-40 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 pt-20">
          {/* Section utilisateur regroupée */}
          {user && (
            <div className="mb-6">
              {/* Infos utilisateur */}
              <div className="flex items-center space-x-3 mb-4 p-3 bg-zinc-800/50 rounded-lg">
                {initials ? (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-zinc-700 text-zinc-200 font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-zinc-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{greetingMessage}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Boutons utilisateur */}
              <div className="space-y-2">
                <Button
                  asChild
                  variant="ghost"
                  className={`w-full justify-start ${isProfilePage 
                    ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Link href="/profile">
                    <User className="h-5 w-5 mr-3" />
                    Info compte
                  </Link>
                </Button>

                <div onClick={onClose}>
                  <AuthButton 
                    variant="ghost" 
                    className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800 h-auto py-3 px-3 font-normal"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-800 mt-6 mb-6"></div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-4">
            {/* Catalogue - toujours visible */}
            <Button
              asChild
              variant="ghost"
              className={`w-full justify-start ${isHomePage 
                ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                : "text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
              onClick={onClose}
            >
              <Link href="/">
                <Film className="h-5 w-5 mr-3" />
                Catalogue
              </Link>
            </Button>

            {/* Mes favoris - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isFavoritesPage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/favorites">
                  <Heart className="h-5 w-5 mr-3" />
                  Mes favoris
                </Link>
              </Button>
            )}

            {/* Déjà visionné - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isWatchedPage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/watched">
                  <Check className="h-5 w-5 mr-3" />
                  Déjà visionné
                </Link>
              </Button>
            )}

            {/* À voir - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isToWatchPage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/to-watch">
                  <Clock className="h-5 w-5 mr-3" />
                  À voir
                </Link>
              </Button>
            )}

            {/* Séparateur après les collections personnelles */}
            {user && (
              <div className="border-t border-zinc-800 my-4"></div>
            )}

            {/* Abonnements - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isAbonnementPage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/abonnement">
                  <CreditCard className="h-5 w-5 mr-3" />
                  Abonnements
                </Link>
              </Button>
            )}

            {/* Comment ça marche - toujours visible */}
            <Button
              asChild
              variant="ghost"
              className={`w-full justify-start ${isHelpPage 
                ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                : "text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Link href="/help">
                <HelpCircle className="h-5 w-5 mr-3" />
                Comment ça marche
              </Link>
            </Button>

            {/* Envoyer un film - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isSendMoviePage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/send-movie">
                  <Upload className="h-5 w-5 mr-3" />
                  Envoyer un film
                </Link>
              </Button>
            )}

            {/* Acheter un film - pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isBuyMoviePage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/buy-movie">
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  Acheter un film
                </Link>
              </Button>
            )}

            {/* Séparateur après les actions films */}
            {user && (
              <div className="border-t border-zinc-800 my-4"></div>
            )}

            {/* Administration pour utilisateurs connectés */}
            {user && (
              <Button
                asChild
                variant="ghost"
                className={`w-full justify-start ${isAdminPage 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800" 
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href="/admin">
                  <Settings className="h-5 w-5 mr-3" />
                  Administration
                </Link>
              </Button>
            )}

            {/* Bouton connexion pour utilisateurs non connectés */}
            {!user && (
              <>
                <div className="border-t border-zinc-800 my-4"></div>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800"
                  onClick={onClose}
                >
                  <Link href="/auth/login">
                    <User className="h-5 w-5 mr-3" />
                    Se connecter
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}