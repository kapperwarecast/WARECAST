"use client"

import { useSidebar } from "@/contexts/sidebar-context"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useSidebar()
  
  return (
    <main className={`
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? 'pr-80' : 'pr-0'}
    `}>
      {children}
    </main>
  )
}