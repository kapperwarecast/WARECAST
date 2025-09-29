"use client"

import { useSidebar } from "@/contexts/sidebar-context"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useSidebar()

  return (
    <main className={`
      transition-all duration-300 ease-in-out min-h-screen
      ${sidebarOpen ? 'mr-0' : 'mr-0'}
    `}>
      <div className={`
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? '' : ''}
      `}>
        {children}
      </div>
    </main>
  )
}