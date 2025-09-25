import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "Vous devez être connecté pour emprunter un film"
      }, { status: 401 })
    }

    // Appeler la fonction RPC intelligente qui gère emprunt existant OU nouveau
    const { data: result, error: rpcError } = await supabase
      .rpc('rent_or_access_movie', {
        p_movie_id: movieId,
        p_auth_user_id: user.id,
        p_payment_id: null
      })

    if (rpcError) {
      console.error("Erreur RPC rent_movie:", rpcError)
      return NextResponse.json({
        success: false,
        error: "Erreur technique lors de l'emprunt"
      }, { status: 500 })
    }

    // Retourner le résultat de la fonction RPC
    return NextResponse.json(result, {
      status: result.success ? 200 : 409
    })

  } catch (error) {
    console.error("Erreur API rent:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}