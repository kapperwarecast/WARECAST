import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("abonnements")
      .select("*")
      .order("prix", { ascending: true })

    if (error) {
      console.error("Error fetching available subscriptions:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des abonnements" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriptions: data || [],
    })
  } catch (error) {
    console.error("Unexpected error in available-subscriptions API:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
