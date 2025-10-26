import { NextResponse } from "next/server"
import { getMoviePlayData } from "@/lib/server/movie-play-data"

interface RouteContext {
  params: Promise<{
    movieId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { movieId } = await context.params

    if (!movieId) {
      return NextResponse.json(
        { success: false, error: "Movie ID manquant" },
        { status: 400 }
      )
    }

    const playData = await getMoviePlayData(movieId)

    if (!playData) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des données" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: playData,
    })
  } catch (error) {
    console.error("Unexpected error in movie-play-data API:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
