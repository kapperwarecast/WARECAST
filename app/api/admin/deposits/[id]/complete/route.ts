import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getErrorMessage } from "@/lib/utils/type-guards"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface AdminCompleteDepositResult {
  deposit_id: string
  registry_id: string
  message: string
}

/**
 * POST /api/admin/deposits/[id]/complete
 * Finalise un dépôt et ajoute le film au registre
 * Nécessite les droits admin
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { id: depositId } = await params

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
        },
        { status: 403 }
      )
    }

    // Parser le body
    const body = await request.json()
    const { movieId } = body

    if (!movieId) {
      return NextResponse.json(
        {
          success: false,
          error: "L'ID du film (movieId) est requis",
        },
        { status: 400 }
      )
    }

    // Appeler la RPC pour compléter
    // Type cast needed: admin_complete_deposit RPC exists in DB but not in generated types yet
    const { data, error: rpcError } = await (supabase.rpc as unknown as (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(
      "admin_complete_deposit",
      {
        p_deposit_id: depositId,
        p_admin_id: user.id,
        p_movie_id: movieId,
      }
    )

    if (rpcError) {
      console.error("Erreur RPC admin_complete_deposit:", rpcError)
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(rpcError, "Erreur lors de la finalisation du dépôt"),
        },
        { status: 500 }
      )
    }

    // Type-safe data access
    const result = data as AdminCompleteDepositResult

    // Succès
    return NextResponse.json({
      success: true,
      deposit_id: result.deposit_id,
      registry_id: result.registry_id,
      message: result.message,
    })
  } catch (error) {
    console.error("Erreur API admin complete deposit:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    )
  }
}
