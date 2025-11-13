import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface Params {
  params: Promise<{
    slug: string
  }>
}

/**
 * GET /api/movies/by-slug/[slug]
 * Récupère un film par son slug
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: movie, error } = await supabase
      .from("movies")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error) {
      console.error("Error fetching movie by slug:", error)
      return NextResponse.json(
        { error: "Film non trouvé" },
        { status: 404 }
      )
    }

    if (!movie) {
      return NextResponse.json(
        { error: "Film non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(movie, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/movies/by-slug/[slug]:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
