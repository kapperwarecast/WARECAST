import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getErrorMessage } from "@/lib/utils/type-guards"

export const dynamic = "force-dynamic"

interface UserDeposit {
  id: string
  user_id: string
  film_title: string
  support_type: string
  tracking_number: string
  status: string
  created_at: string
  tmdb_id?: number
  additional_notes?: string
  admin_received_at?: string
  admin_rejected_at?: string
  rejection_reason?: string
}

/**
 * GET /api/deposits
 * Récupère tous les dépôts de l'utilisateur connecté
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

    // Appeler la RPC pour récupérer les dépôts
    // Type cast needed: get_user_deposits RPC exists in DB but not in generated types yet
    const { data, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      params: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>)(
      "get_user_deposits",
      {
        p_user_id: user.id,
      }
    )

    if (rpcError) {
      console.error("Erreur RPC get_user_deposits:", rpcError)
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
    const deposits = (data as UserDeposit[]) || []

    // Succès
    return NextResponse.json({
      success: true,
      deposits,
      count: deposits.length,
    })
  } catch (error) {
    console.error("Erreur API get deposits:", error)
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
