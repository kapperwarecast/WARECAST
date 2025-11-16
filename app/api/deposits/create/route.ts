import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getErrorMessage } from "@/lib/utils/type-guards"

export const dynamic = "force-dynamic"

interface CreateFilmDepositResult {
  deposit_id: string
  tracking_number: string
  message: string
}

/**
 * POST /api/deposits/create
 * Crée un nouveau dépôt de film physique
 * Génère un numéro de tracking au format WC-YYYYMMDD-XXXXX
 */
export async function POST(request: NextRequest) {
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
          error: "Vous devez être connecté pour créer un dépôt",
        },
        { status: 401 }
      )
    }

    // Parser le body
    const body = await request.json()
    const { filmTitle, supportType, tmdbId, additionalNotes } = body

    // Validation des paramètres
    if (!filmTitle || !supportType) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres manquants (filmTitle, supportType)",
        },
        { status: 400 }
      )
    }

    if (!["Blu-ray", "DVD"].includes(supportType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type de support invalide (doit être Blu-ray ou DVD)",
        },
        { status: 400 }
      )
    }

    // Appeler la RPC pour créer le dépôt
    const { data, error: rpcError } = await supabase.rpc(
      "create_film_deposit",
      {
        p_user_id: user.id,
        p_film_title: filmTitle,
        p_support_type: supportType,
        p_tmdb_id: tmdbId || null,
        p_additional_notes: additionalNotes || null,
      }
    )

    if (rpcError) {
      console.error("Erreur RPC create_film_deposit:", rpcError)
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(rpcError, "Erreur lors de la création du dépôt"),
        },
        { status: 500 }
      )
    }

    // Type-safe data access
    const result = data as CreateFilmDepositResult

    // Succès
    return NextResponse.json({
      success: true,
      deposit_id: result.deposit_id,
      tracking_number: result.tracking_number,
      message: result.message,
    })
  } catch (error) {
    console.error("Erreur API create deposit:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    )
  }
}
