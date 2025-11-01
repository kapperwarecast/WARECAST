import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Layout protégé pour les pages d'administration
 * Vérifie côté serveur que l'utilisateur est connecté ET admin
 * Redirige vers l'accueil si non autorisé
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Récupérer le profil utilisateur pour vérifier is_admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  // Rediriger si pas admin
  if (!profile || !profile.is_admin) {
    redirect('/')
  }

  // Utilisateur authentifié ET admin : afficher le contenu
  return <>{children}</>
}
