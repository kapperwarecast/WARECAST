"use client"

import { ListFilter, Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFiltersModal } from "@/contexts/filters-context"
import { useSidebar } from "@/contexts/sidebar-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  const { user } = useAuth()
  const { openFiltersModal, hasActiveFilters } = useFiltersModal()
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const router = useRouter()

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