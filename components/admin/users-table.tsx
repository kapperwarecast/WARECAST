'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Search, Shield, ShieldOff, Crown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ToggleAdminDialog } from './toggle-admin-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'
import { GrantLifetimeDialog } from './grant-lifetime-dialog'

export interface AdminUser {
  id: string
  email: string | null
  username: string | null
  prenom: string | null
  nom: string | null
  avatar_url: string | null
  is_admin: boolean
  stripe_customer_id: string | null
  created_at: string | null
  last_sign_in_at: string | null
  subscription_status: 'active' | 'resigned' | 'expired' | 'none'
  subscription_expires_at: string | null
  total_paid_rentals: number
  total_subscription_rentals: number
}

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [toggleAdminDialogOpen, setToggleAdminDialogOpen] = useState(false)
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [cancelSubscriptionDialogOpen, setCancelSubscriptionDialogOpen] = useState(false)
  const [grantLifetimeDialogOpen, setGrantLifetimeDialogOpen] = useState(false)

  // Fetch users from API (extracted for reusability)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/admin/users')

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs')
      }

      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('[UsersTable] Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handlers for dialog actions
  const handleToggleAdmin = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDeleteUser = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCancelSubscription = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleGrantLifetime = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()

    return users.filter(user => {
      const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase()
      const email = (user.email || '').toLowerCase()
      const username = (user.username || '').toLowerCase()

      return fullName.includes(query) || email.includes(query) || username.includes(query)
    })
  }, [users, searchQuery])

  // Get subscription badge variant and label
  const getSubscriptionBadge = (
    status: AdminUser['subscription_status'],
    expiresAt: string | null
  ) => {
    // Détection abonnement à vie (expire après 2099)
    if (expiresAt && new Date(expiresAt) > new Date('2099-01-01')) {
      return { variant: 'default' as const, label: 'À vie', className: 'bg-purple-600' }
    }

    switch (status) {
      case 'active':
        return { variant: 'default' as const, label: 'Abonné actif', className: 'bg-green-600' }
      case 'resigned':
        return { variant: 'secondary' as const, label: 'Résilié', className: 'bg-orange-600' }
      case 'expired':
        return { variant: 'outline' as const, label: 'Expiré', className: '' }
      case 'none':
        return { variant: 'outline' as const, label: 'Non abonné', className: '' }
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr })
    } catch {
      return '-'
    }
  }

  // Get user initials for avatar
  const getUserInitials = (user: AdminUser) => {
    if (user.prenom && user.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md bg-zinc-800" />
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-2 bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/20 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-400">
        {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              <TableHead className="text-zinc-400">Utilisateur</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Statut</TableHead>
              <TableHead className="text-zinc-400">Admin</TableHead>
              <TableHead className="text-zinc-400 text-right">Films achetés</TableHead>
              <TableHead className="text-zinc-400 text-right">Films abonnement</TableHead>
              <TableHead className="text-zinc-400">Inscrit le</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const subscriptionBadge = getSubscriptionBadge(
                  user.subscription_status,
                  user.subscription_expires_at
                )

                return (
                  <TableRow
                    key={user.id}
                    className="border-zinc-800 hover:bg-zinc-900/50"
                  >
                    {/* User column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">
                            {user.prenom && user.nom
                              ? `${user.prenom} ${user.nom}`
                              : user.username || 'Sans nom'}
                          </p>
                          {user.username && user.prenom && (
                            <p className="text-xs text-zinc-500">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Email column */}
                    <TableCell className="text-zinc-300">
                      {user.email || '-'}
                    </TableCell>

                    {/* Subscription status column */}
                    <TableCell>
                      <Badge
                        variant={subscriptionBadge.variant}
                        className={subscriptionBadge.className}
                      >
                        {subscriptionBadge.label}
                      </Badge>
                    </TableCell>

                    {/* Admin column */}
                    <TableCell>
                      {user.is_admin ? (
                        <Badge className="bg-purple-600 flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <span className="text-zinc-500 text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Paid rentals count */}
                    <TableCell className="text-right text-zinc-300">
                      {user.total_paid_rentals}
                    </TableCell>

                    {/* Subscription rentals count */}
                    <TableCell className="text-right text-zinc-300">
                      {user.total_subscription_rentals}
                    </TableCell>

                    {/* Created at column */}
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>

                    {/* Actions column */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem className="cursor-pointer">
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedUser(user)
                              setToggleAdminDialogOpen(true)
                            }}
                          >
                            {user.is_admin ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Retirer admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Promouvoir admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-purple-400"
                            onClick={() => {
                              setSelectedUser(user)
                              setGrantLifetimeDialogOpen(true)
                            }}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Attribuer abonnement à vie
                          </DropdownMenuItem>
                          {user.subscription_status === 'active' && (
                            <DropdownMenuItem
                              className="cursor-pointer text-orange-400"
                              onClick={() => {
                                setSelectedUser(user)
                                setCancelSubscriptionDialogOpen(true)
                              }}
                            >
                              Résilier abonnement
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer text-red-400"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteUserDialogOpen(true)
                            }}
                          >
                            Supprimer utilisateur
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <ToggleAdminDialog
        user={selectedUser}
        open={toggleAdminDialogOpen}
        onOpenChange={setToggleAdminDialogOpen}
        onToggled={handleToggleAdmin}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
        onDeleted={handleDeleteUser}
      />

      <CancelSubscriptionDialog
        user={selectedUser}
        open={cancelSubscriptionDialogOpen}
        onOpenChange={setCancelSubscriptionDialogOpen}
        onCancelled={handleCancelSubscription}
      />

      <GrantLifetimeDialog
        user={selectedUser}
        isOpen={grantLifetimeDialogOpen}
        onClose={() => setGrantLifetimeDialogOpen(false)}
        onSuccess={handleGrantLifetime}
      />
    </div>
  )
}
