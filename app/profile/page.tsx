"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, Lock } from "lucide-react"
import Link from "next/link"

function ProfileContent() {
  const { user, profile } = useAuth()

  if (!user) return null

  const displayName = profile ?
    `${profile.prenom || ''} ${profile.nom || ''}`.trim() || profile.username :
    user.email?.split('@')[0]

  const initials = profile && (profile.prenom || profile.nom) ?
    `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase() :
    user.email?.[0]?.toUpperCase()

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl font-medium">
                  {initials || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-white text-2xl">
              {displayName || 'Utilisateur'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-zinc-300 font-medium">Prénom</h3>
                <p className="text-white">{profile?.prenom || 'Non renseigné'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-zinc-300 font-medium">Nom</h3>
                <p className="text-white">{profile?.nom || 'Non renseigné'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-zinc-300 font-medium">Nom d&apos;utilisateur</h3>
                <p className="text-white">{profile?.username || 'Non défini'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-zinc-300 font-medium">Membre depuis</h3>
                <p className="text-white">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <h3 className="text-zinc-300 font-medium mb-2">Email</h3>
              <p className="text-white">{user.email}</p>
              {user.email_confirmed_at ? (
                <p className="text-green-400 text-sm mt-1">✓ Email vérifié</p>
              ) : (
                <p className="text-yellow-400 text-sm mt-1">⚠ Email non vérifié</p>
              )}
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <h3 className="text-zinc-300 font-medium mb-3">Sécurité</h3>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
              >
                <Link href="/settings/security">
                  <Lock className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}