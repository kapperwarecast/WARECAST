import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from("user_abonnements")
      .select(`
        *,
        abonnement:abonnements(*)
      `)
      .eq("user_id", user.id)
      .in("statut", ["actif", "résilié", "resilie"])
      .order("date_expiration", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Error fetching user subscription:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération de l'abonnement" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: data || null,
    })
  } catch (error) {
    console.error("Unexpected error in user-subscription API:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
