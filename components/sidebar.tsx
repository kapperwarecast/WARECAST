"use client"

import { UserSection } from "@/components/sidebar/user-section"
import { AuthSection } from "@/components/sidebar/auth-section"
import { MenuSection } from "@/components/sidebar/menu-section"
import { useUserDisplay } from "@/hooks/useUserDisplay"
import { NAV_SECTIONS } from "@/constants/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAuthenticated } = useUserDisplay()
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
          {/* Section d'authentification - toujours en haut */}
          {isAuthenticated ? (
            <UserSection onClose={onClose} />
          ) : (
            <AuthSection onClose={onClose} />
          )}

          {/* Menu Items */}
          <div className="space-y-4">
            {NAV_SECTIONS.map(section => (
              <MenuSection
                key={section.id}
                section={section}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}