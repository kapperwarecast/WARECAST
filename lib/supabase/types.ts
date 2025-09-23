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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duree_mois: number
          emprunts_illimites?: boolean
          id?: string
          nom: string
          prix: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duree_mois?: number
          emprunts_illimites?: boolean
          id?: string
          nom?: string
          prix?: number
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
          montant_paye: number | null
          movie_id: string
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
          montant_paye?: number | null
          movie_id: string
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
          montant_paye?: number | null
          movie_id?: string
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
          statut?: string | null
          subtitle_path?: string | null
          synopsis?: string | null
          titre_francais?: string | null
          titre_original?: string | null
          tmdb_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_abonnements: {
        Row: {
          abonnement_id: string
          created_at: string | null
          date_expiration: string
          date_souscription: string | null
          id: string
          statut: string
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
          nom: string | null
          prenom: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          nom?: string | null
          prenom?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          nom?: string | null
          prenom?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_overdue_emprunts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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