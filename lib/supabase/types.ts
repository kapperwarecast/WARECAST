export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          created_at: string | null
          duree_mois: number
          emprunts_illimites: boolean
          id: string
          nom: string
          prix: number
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duree_mois: number
          emprunts_illimites?: boolean
          id?: string
          nom: string
          prix: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duree_mois?: number
          emprunts_illimites?: boolean
          id?: string
          nom?: string
          prix?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      actors: {
        Row: {
          created_at: string | null
          id: string
          nom: string | null
          nom_complet: string
          photo_path: string | null
          prenom: string | null
          tmdb_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nom?: string | null
          nom_complet: string
          photo_path?: string | null
          prenom?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nom?: string | null
          nom_complet?: string
          photo_path?: string | null
          prenom?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      directors: {
        Row: {
          created_at: string | null
          id: string
          nom: string | null
          nom_complet: string
          photo_path: string | null
          prenom: string | null
          tmdb_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nom?: string | null
          nom_complet: string
          photo_path?: string | null
          prenom?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nom?: string | null
          nom_complet?: string
          photo_path?: string | null
          prenom?: string | null
          tmdb_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emprunts: {
        Row: {
          created_at: string | null
          date_emprunt: string | null
          date_retour: string
          id: string
          last_watched_at: string | null
          montant_paye: number | null
          movie_id: string
          payment_id: string | null
          position_seconds: number | null
          statut: string
          type_emprunt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_emprunt?: string | null
          date_retour: string
          id?: string
          last_watched_at?: string | null
          montant_paye?: number | null
          movie_id: string
          payment_id?: string | null
          position_seconds?: number | null
          statut?: string
          type_emprunt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_emprunt?: string | null
          date_retour?: string
          id?: string
          last_watched_at?: string | null
          montant_paye?: number | null
          movie_id?: string
          payment_id?: string | null
          position_seconds?: number | null
          statut?: string
          type_emprunt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emprunts_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprunts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprunts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_actors: {
        Row: {
          actor_id: string
          created_at: string | null
          id: string
          movie_id: string
          ordre_casting: number | null
          role_personnage: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          id?: string
          movie_id: string
          ordre_casting?: number | null
          role_personnage?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          id?: string
          movie_id?: string
          ordre_casting?: number | null
          role_personnage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_actors_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_actors_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_directors: {
        Row: {
          created_at: string | null
          director_id: string
          id: string
          job: string | null
          movie_id: string
        }
        Insert: {
          created_at?: string | null
          director_id: string
          id?: string
          job?: string | null
          movie_id: string
        }
        Update: {
          created_at?: string | null
          director_id?: string
          id?: string
          job?: string | null
          movie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_directors_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "directors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_directors_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          annee_sortie: number | null
          copies_disponibles: number
          created_at: string | null
          duree: number | null
          genres: string[] | null
          id: string
          langue_vo: string | null
          lien_vimeo: string | null
          nombre_copies: number
          note_tmdb: number | null
          poster_local_path: string | null
          random_order: number | null
          search_vector: unknown
          statut: string | null
          subtitle_path: string | null
          synopsis: string | null
          titre_francais: string | null
          titre_original: string | null
          tmdb_id: number
          updated_at: string | null
        }
        Insert: {
          annee_sortie?: number | null
          copies_disponibles?: number
          created_at?: string | null
          duree?: number | null
          genres?: string[] | null
          id?: string
          langue_vo?: string | null
          lien_vimeo?: string | null
          nombre_copies?: number
          note_tmdb?: number | null
          poster_local_path?: string | null
          random_order?: number | null
          search_vector?: unknown
          statut?: string | null
          subtitle_path?: string | null
          synopsis?: string | null
          titre_francais?: string | null
          titre_original?: string | null
          tmdb_id: number
          updated_at?: string | null
        }
        Update: {
          annee_sortie?: number | null
          copies_disponibles?: number
          created_at?: string | null
          duree?: number | null
          genres?: string[] | null
          id?: string
          langue_vo?: string | null
          lien_vimeo?: string | null
          nombre_copies?: number
          note_tmdb?: number | null
          poster_local_path?: string | null
          random_order?: number | null
          search_vector?: unknown
          statut?: string | null
          subtitle_path?: string | null
          synopsis?: string | null
          titre_original?: string | null
          tmdb_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          description: string | null
          external_payment_id: string | null
          id: string
          payment_intent_data: Json | null
          payment_method: string | null
          payment_type: string
          rental_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_payment_id?: string | null
          id?: string
          payment_intent_data?: Json | null
          payment_method?: string | null
          payment_type: string
          rental_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_payment_id?: string | null
          id?: string
          payment_intent_data?: Json | null
          payment_method?: string | null
          payment_type?: string
          rental_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "emprunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_abonnements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_abonnements: {
        Row: {
          abonnement_id: string
          created_at: string | null
          date_expiration: string
          date_souscription: string | null
          id: string
          statut: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abonnement_id: string
          created_at?: string | null
          date_expiration: string
          date_souscription?: string | null
          id?: string
          statut?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abonnement_id?: string
          created_at?: string | null
          date_expiration?: string
          date_souscription?: string | null
          id?: string
          statut?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_abonnements_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_abonnements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          is_admin: boolean
          nom: string | null
          prenom: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          is_admin?: boolean
          nom?: string | null
          prenom?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean
          nom?: string | null
          prenom?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      video_watch_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          last_position: number | null
          movie_id: string
          session_id: string
          updated_at: string | null
          user_id: string | null
          watch_duration: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          movie_id: string
          session_id: string
          updated_at?: string | null
          user_id?: string | null
          watch_duration?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          movie_id?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
          watch_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_sessions_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_overdue_rentals: { Args: never; Returns: number }
      expire_overdue_rentals: { Args: never; Returns: number }
      filter_directors_by_movies: {
        Args: {
          p_decade_start: number | null
          p_decade_end: number | null
          p_language: string | null
        }
        Returns: { director_id: string }[]
      }
      refresh_random_order: { Args: never; Returns: undefined }
      rent_movie: {
        Args: { p_auth_user_id: string; p_movie_id: string }
        Returns: Json
      }
      rent_or_access_movie: {
        Args: {
          p_auth_user_id: string
          p_movie_id: string
          p_payment_id?: string
        }
        Returns: Json
      }
      search_movies: {
        Args: {
          filter_available_only?: boolean
          filter_decade?: number
          filter_genres?: string[]
          filter_language?: string
          page_limit?: number
          page_number?: number
          search_query: string
        }
        Returns: {
          annee_sortie: number
          copies_disponibles: number
          duree: number
          id: string
          langue_vo: string
          poster_local_path: string
          rank: number
          titre_francais: string
          titre_original: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_overdue_emprunts: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
