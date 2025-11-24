'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HistoryRow {
  transfer_id: string
  film_title: string
  film_slug: string
  physical_support_type: string
  from_owner_id: string | null
  from_owner_prenom: string | null
  from_owner_nom: string | null
  from_owner_username: string | null
  to_owner_id: string
  to_owner_prenom: string
  to_owner_nom: string
  to_owner_username: string
  transfer_type: string
  transfer_date: string
}

export function HistoryTable() {
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = history.filter((row) => {
      const filmMatch = row.film_title?.toLowerCase().includes(query)
      const fromOwnerMatch =
        row.from_owner_prenom?.toLowerCase().includes(query) ||
        row.from_owner_nom?.toLowerCase().includes(query) ||
        row.from_owner_username?.toLowerCase().includes(query)
      const toOwnerMatch =
        row.to_owner_prenom?.toLowerCase().includes(query) ||
        row.to_owner_nom?.toLowerCase().includes(query) ||
        row.to_owner_username?.toLowerCase().includes(query)

      return filmMatch || fromOwnerMatch || toOwnerMatch
    })

    setFilteredHistory(filtered)
  }, [searchQuery, history])

  async function loadHistory() {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: queryError } = await supabase
        .from('ownership_history')
        .select(`
          id,
          transfer_date,
          transfer_type,
          from_owner_id,
          to_owner_id,
          films_registry!inner (
            physical_support_type,
            movies!inner (
              titre_francais,
              slug
            )
          ),
          from_profiles:from_owner_id (
            prenom,
            nom,
            username
          ),
          to_profiles:to_owner_id (
            prenom,
            nom,
            username
          )
        `)
        .order('transfer_date', { ascending: false })
        .limit(500)

      if (queryError) {
        console.error('[HistoryTable] Error loading history:', queryError)
        throw new Error(queryError.message)
      }

      // Transform data to match expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedData = (data || []).map((row: any) => ({
        transfer_id: row.id,
        film_title: row.films_registry?.movies?.titre_francais || 'Film inconnu',
        film_slug: row.films_registry?.movies?.slug || '',
        physical_support_type: row.films_registry?.physical_support_type || 'inconnu',
        from_owner_id: row.from_owner_id,
        from_owner_prenom: row.from_profiles?.prenom || null,
        from_owner_nom: row.from_profiles?.nom || null,
        from_owner_username: row.from_profiles?.username || null,
        to_owner_id: row.to_owner_id,
        to_owner_prenom: row.to_profiles?.prenom || null,
        to_owner_nom: row.to_profiles?.nom || null,
        to_owner_username: row.to_profiles?.username || null,
        transfer_type: row.transfer_type,
        transfer_date: row.transfer_date
      }))

      setHistory(transformedData)
      setFilteredHistory(transformedData)
    } catch (err) {
      console.error('[HistoryTable] Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  const getTransferTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return { variant: 'default' as const, label: 'Dépôt', className: 'bg-blue-600 hover:bg-blue-700' }
      case 'exchange':
        return { variant: 'default' as const, label: 'Échange', className: 'bg-orange-600 hover:bg-orange-700' }
      case 'sponsorship':
        return { variant: 'default' as const, label: 'Parrainage', className: 'bg-purple-600 hover:bg-purple-700' }
      case 'redistribution':
        return { variant: 'default' as const, label: 'Redistribution', className: 'bg-red-600 hover:bg-red-700' }
      default:
        return { variant: 'outline' as const, label: type, className: '' }
    }
  }

  const getSupportBadge = (type: string) => {
    switch (type) {
      case 'blu-ray':
        return { label: 'Blu-ray', className: 'bg-zinc-700 text-zinc-200' }
      case 'dvd':
        return { label: 'DVD', className: 'bg-zinc-700 text-zinc-200' }
      case '4k':
        return { label: '4K', className: 'bg-zinc-700 text-zinc-200' }
      default:
        return { label: type, className: 'bg-zinc-700 text-zinc-200' }
    }
  }

  const formatOwnerName = (prenom: string | null, nom: string | null, username: string | null) => {
    if (prenom && nom) {
      return `${prenom} ${nom}`
    }
    if (username) {
      return username
    }
    return '-'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-400">Erreur lors du chargement de l&apos;historique</p>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Rechercher par film ou utilisateur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-400">
        {filteredHistory.length} transfert{filteredHistory.length > 1 ? 's' : ''}
        {searchQuery && ` (sur ${history.length} total)`}
      </div>

      {/* Table */}
      {filteredHistory.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">
            {searchQuery ? 'Aucun transfert trouvé pour cette recherche' : 'Aucun transfert enregistré'}
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-900 hover:bg-zinc-900 border-zinc-800">
                <TableHead className="text-zinc-300 font-semibold">Film</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Support</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Propriétaire actuel</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Propriétaire précédent</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Type</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((row) => {
                const transferBadge = getTransferTypeBadge(row.transfer_type)
                const supportBadge = getSupportBadge(row.physical_support_type)

                return (
                  <TableRow
                    key={row.transfer_id}
                    className="border-zinc-800 hover:bg-zinc-900/50"
                  >
                    <TableCell className="text-white font-medium">
                      {row.film_title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={supportBadge.className}>
                        {supportBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatOwnerName(row.to_owner_prenom, row.to_owner_nom, row.to_owner_username)}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatOwnerName(row.from_owner_prenom, row.from_owner_nom, row.from_owner_username)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transferBadge.variant} className={transferBadge.className}>
                        {transferBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {format(new Date(row.transfer_date), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
