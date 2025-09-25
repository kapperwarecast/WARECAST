import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all likes for this user with movie counts
    const { data: userLikes, error: likesError } = await supabase
      .from("likes")
      .select("movie_id")
      .eq("user_id", user.id)

    if (likesError) {
      console.error("Error fetching user likes:", likesError)
      return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
    }

    // Get total counts for each movie the user has liked
    const movieIds = userLikes.map(like => like.movie_id)

    if (movieIds.length === 0) {
      return NextResponse.json({
        success: true,
        likes: {},
      })
    }

    // Fetch counts for all movies in a single query
    const { data: countData, error: countError } = await supabase
      .from("likes")
      .select("movie_id")
      .in("movie_id", movieIds)

    if (countError) {
      console.error("Error counting likes:", countError)
      return NextResponse.json({ error: "Failed to count likes" }, { status: 500 })
    }

    // Count likes per movie
    const likeCounts = countData.reduce((acc, like) => {
      acc[like.movie_id] = (acc[like.movie_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Build response object
    const likes = movieIds.reduce((acc, movieId) => {
      acc[movieId] = {
        isLiked: true,
        count: likeCounts[movieId] || 1,
        lastSync: Date.now(),
      }
      return acc
    }, {} as Record<string, { isLiked: boolean; count: number; lastSync: number }>)

    return NextResponse.json({
      success: true,
      likes,
    })

  } catch (error) {
    console.error("Error in GET /api/likes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}