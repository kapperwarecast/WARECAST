export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string
          slug: string
          titre_francais: string | null
          titre_original: string | null
          annee_sortie: number | null
          synopsis: string | null
          duree: number | null
          genres: string[] | null
          langue_vo: string | null
          note_tmdb: number | null
          poster_local_path: string | null
          lien_vimeo: string | null
          subtitle_path: string | null
          nombre_copies: number
          copies_disponibles: number
          statut: string | null
          tmdb_id: number
          random_order: number | null
          search_vector: unknown
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          titre_francais?: string | null
          titre_original?: string | null
          annee_sortie?: number | null
          synopsis?: string | null
          duree?: number | null
          genres?: string[] | null
          langue_vo?: string | null
          note_tmdb?: number | null
          poster_local_path?: string | null
          lien_vimeo?: string | null
          subtitle_path?: string | null
          nombre_copies?: number
          copies_disponibles?: number
          statut?: string | null
          tmdb_id: number
          random_order?: number | null
          search_vector?: unknown
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          titre_francais?: string | null
          titre_original?: string | null
          annee_sortie?: number | null
          synopsis?: string | null
          duree?: number | null
          genres?: string[] | null
          langue_vo?: string | null
          note_tmdb?: number | null
          poster_local_path?: string | null
          lien_vimeo?: string | null
          subtitle_path?: string | null
          nombre_copies?: number
          copies_disponibles?: number
          statut?: string | null
          tmdb_id?: number
          random_order?: number | null
          search_vector?: unknown
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      actors: {
        Row: {
          id: string
          slug: string
          tmdb_id: number | null
          nom_complet: string
          prenom: string | null
          nom: string | null
          photo_path: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          tmdb_id?: number | null
          nom_complet: string
          prenom?: string | null
          nom?: string | null
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          tmdb_id?: number | null
          nom_complet?: string
          prenom?: string | null
          nom?: string | null
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      directors: {
        Row: {
          id: string
          slug: string
          tmdb_id: number | null
          nom_complet: string
          prenom: string | null
          nom: string | null
          photo_path: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          tmdb_id?: number | null
          nom_complet: string
          prenom?: string | null
          nom?: string | null
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          tmdb_id?: number | null
          nom_complet?: string
          prenom?: string | null
          nom?: string | null
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
