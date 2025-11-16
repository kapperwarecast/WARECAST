import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getErrorMessage } from "@/lib/utils/type-guards"

export const dynamic = "force-dynamic"

interface PendingDeposit {
  id: string
  user_id: string
  film_title: string
  support_type: string
  tracking_number: string
  status: string
  created_at: string
  tmdb_id?: number
  additional_notes?: string
}

/**
 * GET /api/admin/deposits/pending
 * Récupère tous les dépôts en attente de traitement
 * Nécessite les droits admin
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous devez être connecté",
          deposits: [],
        },
        { status: 401 }
      )
    }

    // Vérifier les droits admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès réservé aux administrateurs",
          deposits: [],
        },
        { status: 403 }
      )
    }

    // Appeler la RPC pour récupérer les dépôts en attente
    // Type cast needed: admin_get_pending_deposits RPC exists in DB but not in generated types yet
    const { data, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      params?: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>)(
      "admin_get_pending_deposits"
    )

    if (rpcError) {
      console.error("Erreur RPC admin_get_pending_deposits:", rpcError)
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(rpcError, "Erreur lors de la récupération des dépôts"),
          deposits: [],
        },
        { status: 500 }
      )
    }

    // Type-safe data access
    const deposits = (data as PendingDeposit[]) || []

    // Succès
    return NextResponse.json({
      success: true,
      deposits,
      count: deposits.length,
    })
  } catch (error) {
    console.error("Erreur API admin get pending deposits:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        deposits: [],
      },
      { status: 500 }
    )
  }
}
