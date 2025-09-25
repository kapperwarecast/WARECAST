import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Récupérer les informations du film
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, titre_francais, titre_original, annee_sortie, poster_local_path')
      .eq('id', movieId)
      .single()

    if (movieError || !movie) {
      return NextResponse.json({
        error: "Film non trouvé"
      }, { status: 404 })
    }

    return NextResponse.json(movie)

  } catch (error) {
    console.error("Erreur API get movie:", error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}