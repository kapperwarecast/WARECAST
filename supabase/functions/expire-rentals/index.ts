// Supabase Edge Function - Expiration automatique des emprunts
// Cette fonction doit être planifiée pour s'exécuter périodiquement (toutes les heures)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Types
interface RentalExpirationResult {
  expired_count: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

// Headers CORS pour permettre les appels depuis n'importe où
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec les credentials de l'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Appeler la fonction PostgreSQL expire_overdue_rentals()
    const { data, error } = await supabase.rpc("expire_overdue_rentals");

    if (error) {
      console.error("Error expiring rentals:", error);
      throw error;
    }

    const expiredCount = data || 0;

    console.log(`Successfully expired ${expiredCount} rentals`);

    const result: RentalExpirationResult = {
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
      success: true,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Fatal error in expire-rentals function:", error);

    const result: RentalExpirationResult = {
      expired_count: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
});
