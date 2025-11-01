"use client"

import { ListFilter, Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFiltersModal } from "@/contexts/filters-context"
import { useSidebar } from "@/contexts/sidebar-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

export function Navbar() {
  const { user } = useAuth()
  const { openFiltersModal, hasActiveFilters, searchQuery, setSearchQuery, searchBarOpen, toggleSearchBar } = useFiltersModal()
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [inputValue, setInputValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Detect if on directors page to adapt search placeholder
  const isDirectorsPage = pathname === '/realisateurs'
  const searchPlaceholder = isDirectorsPage
    ? "Rechercher un réalisateur..."
    : "Rechercher un film, acteur, réalisateur..."

  const handleCloseAndGoHome = () => {
    closeSidebar()
    router.push('/')
  }

  // Debounce pour la recherche en temps réel
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue)
    }, 500)

    return () => clearTimeout(timer)
  }, [inputValue, setSearchQuery])

  // Focus sur l'input quand la barre s'ouvre
  useEffect(() => {
    if (searchBarOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchBarOpen])

  const handleSearchClick = () => {
    toggleSearchBar()
    if (!searchBarOpen) {
      // La barre va s'ouvrir, on va focus l'input
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  const handleClearSearch = () => {
    setInputValue('')
    setSearchQuery('')
    searchInputRef.current?.focus()
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

              {/* Barre de recherche avec expansion */}
              <div className="flex items-center gap-2">
                <div
                  className="relative flex items-center overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    width: searchBarOpen ? '280px' : '0px',
                    opacity: searchBarOpen ? 1 : 0
                  }}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-9 px-3 pr-8 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  {inputValue && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 text-zinc-400 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={searchQuery || searchBarOpen
                    ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }
                  aria-label="Search"
                  onClick={handleSearchClick}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Right side - Always show + button */}
          <div className="flex items-center gap-2">
            {/* Bouton + toujours visible */}
            <Button
              variant="ghost"
              size="icon"
              className={sidebarOpen
                ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-800 z-[51] relative"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800 z-[51] relative"
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

          </div>
        </div>
      </div>
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
    </nav>
  )
}