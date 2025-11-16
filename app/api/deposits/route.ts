import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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
    const { data, error: rpcError } = await supabase.rpc(
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
          error: "Erreur lors de la récupération des dépôts",
          deposits: [],
        },
        { status: 500 }
      )
    }

    // Succès
    return NextResponse.json({
      success: true,
      deposits: data || [],
      count: data?.length || 0,
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
