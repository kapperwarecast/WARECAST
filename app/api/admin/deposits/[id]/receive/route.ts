import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getErrorMessage } from "@/lib/utils/type-guards"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface AdminMarkDepositReceivedResult {
  deposit_id: string
  message: string
}

/**
 * POST /api/admin/deposits/[id]/receive
 * Marque un dépôt comme réceptionné par l'admin
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

    // Appeler la RPC pour marquer comme reçu
    // Type cast needed: admin_mark_deposit_received RPC exists in DB but not in generated types yet
    const { data, error: rpcError } = await (supabase.rpc as unknown as (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(
      "admin_mark_deposit_received",
      {
        p_deposit_id: depositId,
        p_admin_id: user.id,
      }
    )

    if (rpcError) {
      console.error("Erreur RPC admin_mark_deposit_received:", rpcError)
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(rpcError, "Erreur lors du marquage du dépôt"),
        },
        { status: 500 }
      )
    }

    // Type-safe data access
    const result = data as AdminMarkDepositReceivedResult

    // Succès
    return NextResponse.json({
      success: true,
      deposit_id: result.deposit_id,
      message: result.message,
    })
  } catch (error) {
    console.error("Erreur API admin receive deposit:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    )
  }
}
