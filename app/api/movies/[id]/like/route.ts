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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert like with ON CONFLICT handling (thanks to unique constraint)
    const { error: insertError } = await supabase
      .from("likes")
      .insert({
        user_id: user.id,
        movie_id: movieId,
      })

    if (insertError) {
      // If it's a conflict (like already exists), it's not an error
      if (!insertError.code?.includes("23505")) { // PostgreSQL unique violation code
        console.error("Error inserting like:", insertError)
        return NextResponse.json({ error: "Failed to like movie" }, { status: 500 })
      }
    }

    // Get total count of likes for this movie
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("movie_id", movieId)

    if (countError) {
      console.error("Error counting likes:", countError)
      return NextResponse.json({ error: "Failed to count likes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isLiked: true,
      count: count || 0,
    })

  } catch (error) {
    console.error("Error in POST /api/movies/[id]/like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the like
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movieId)

    if (deleteError) {
      console.error("Error deleting like:", deleteError)
      return NextResponse.json({ error: "Failed to unlike movie" }, { status: 500 })
    }

    // Get remaining count of likes for this movie
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("movie_id", movieId)

    if (countError) {
      console.error("Error counting likes:", countError)
      return NextResponse.json({ error: "Failed to count likes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isLiked: false,
      count: count || 0,
    })

  } catch (error) {
    console.error("Error in DELETE /api/movies/[id]/like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Get current user (optional for GET - can view counts without auth)
    const { data: { user } } = await supabase.auth.getUser()

    let isLiked = false

    // If user is authenticated, check if they liked this movie
    if (user) {
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .single()

      if (likeError && likeError.code !== "PGRST116") { // Not found is ok
        console.error("Error checking user like:", likeError)
        return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
      }

      isLiked = !!likeData
    }

    // Get total count of likes for this movie
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("movie_id", movieId)

    if (countError) {
      console.error("Error counting likes:", countError)
      return NextResponse.json({ error: "Failed to count likes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isLiked,
      count: count || 0,
    })

  } catch (error) {
    console.error("Error in GET /api/movies/[id]/like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}