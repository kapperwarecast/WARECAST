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
          slug: string
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
          slug: string
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
          slug?: string
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
          slug: string
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
          slug: string
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
          slug?: string
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
      film_deposits: {
        Row: {
          additional_notes: string | null
          completed_at: string | null
          created_at: string
          digitized_at: string | null
          film_title: string
          id: string
          movie_id: string | null
          processed_by_admin_id: string | null
          received_at: string | null
          registry_id: string | null
          rejection_reason: string | null
          sent_at: string
          status: string
          support_type: string
          tmdb_id: number | null
          tracking_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          completed_at?: string | null
          created_at?: string
          digitized_at?: string | null
          film_title: string
          id?: string
          movie_id?: string | null
          processed_by_admin_id?: string | null
          received_at?: string | null
          registry_id?: string | null
          rejection_reason?: string | null
          sent_at?: string
          status?: string
          support_type: string
          tmdb_id?: number | null
          tracking_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          completed_at?: string | null
          created_at?: string
          digitized_at?: string | null
          film_title?: string
          id?: string
          movie_id?: string | null
          processed_by_admin_id?: string | null
          received_at?: string | null
          registry_id?: string | null
          rejection_reason?: string | null
          sent_at?: string
          status?: string
          support_type?: string
          tmdb_id?: number | null
          tracking_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "film_deposits_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_deposits_processed_by_admin_id_fkey"
            columns: ["processed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_deposits_registry_id_fkey"
            columns: ["registry_id"]
            isOneToOne: false
            referencedRelation: "films_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      film_exchanges: {
        Row: {
          completed_at: string | null
          created_at: string
          film_offered_id: string
          film_requested_id: string
          id: string
          initiator_id: string
          payment_id: string | null
          proposed_at: string
          recipient_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          film_offered_id: string
          film_requested_id: string
          id?: string
          initiator_id: string
          payment_id?: string | null
          proposed_at?: string
          recipient_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          film_offered_id?: string
          film_requested_id?: string
          id?: string
          initiator_id?: string
          payment_id?: string | null
          proposed_at?: string
          recipient_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "film_exchanges_film_offered_id_fkey"
            columns: ["film_offered_id"]
            isOneToOne: false
            referencedRelation: "films_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_exchanges_film_requested_id_fkey"
            columns: ["film_requested_id"]
            isOneToOne: false
            referencedRelation: "films_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_exchanges_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_exchanges_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_exchanges_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      films_registry: {
        Row: {
          acquisition_date: string
          acquisition_method: string
          created_at: string
          current_owner_id: string
          deposit_date: string
          id: string
          movie_id: string
          physical_support_type: string
          previous_owner_id: string | null
          transfer_date: string | null
          updated_at: string
        }
        Insert: {
          acquisition_date?: string
          acquisition_method: string
          created_at?: string
          current_owner_id: string
          deposit_date?: string
          id?: string
          movie_id: string
          physical_support_type: string
          previous_owner_id?: string | null
          transfer_date?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_date?: string
          acquisition_method?: string
          created_at?: string
          current_owner_id?: string
          deposit_date?: string
          id?: string
          movie_id?: string
          physical_support_type?: string
          previous_owner_id?: string | null
          transfer_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "films_registry_current_owner_id_fkey"
            columns: ["current_owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "films_registry_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "films_registry_previous_owner_id_fkey"
            columns: ["previous_owner_id"]
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
          created_at: string | null
          duree: number | null
          genres: string[] | null
          id: string
          langue_vo: string | null
          lien_vimeo: string | null
          note_tmdb: number | null
          poster_local_path: string | null
          random_order: number | null
          search_vector: unknown
          slug: string
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
          created_at?: string | null
          duree?: number | null
          genres?: string[] | null
          id?: string
          langue_vo?: string | null
          lien_vimeo?: string | null
          note_tmdb?: number | null
          poster_local_path?: string | null
          random_order?: number | null
          search_vector?: unknown
          slug: string
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
          created_at?: string | null
          duree?: number | null
          genres?: string[] | null
          id?: string
          langue_vo?: string | null
          lien_vimeo?: string | null
          note_tmdb?: number | null
          poster_local_path?: string | null
          random_order?: number | null
          search_vector?: unknown
          slug?: string
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
      ownership_history: {
        Row: {
          created_at: string
          exchange_id: string | null
          film_registry_id: string
          from_owner_id: string | null
          id: string
          to_owner_id: string
          transfer_date: string
          transfer_type: string
        }
        Insert: {
          created_at?: string
          exchange_id?: string | null
          film_registry_id: string
          from_owner_id?: string | null
          id?: string
          to_owner_id: string
          transfer_date?: string
          transfer_type: string
        }
        Update: {
          created_at?: string
          exchange_id?: string | null
          film_registry_id?: string
          from_owner_id?: string | null
          id?: string
          to_owner_id?: string
          transfer_date?: string
          transfer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_history_film_registry_id_fkey"
            columns: ["film_registry_id"]
            isOneToOne: false
            referencedRelation: "films_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_history_from_owner_id_fkey"
            columns: ["from_owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_history_to_owner_id_fkey"
            columns: ["to_owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      sponsor_badges: {
        Row: {
          awarded_at: string
          badge_level: string
          created_at: string
          id: string
          sponsorship_count: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_level: string
          created_at?: string
          id?: string
          sponsorship_count: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_level?: string
          created_at?: string
          id?: string
          sponsorship_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          badge_awarded: string | null
          created_at: string
          film_given_id: string
          id: string
          sponsor_id: string
          sponsored_user_id: string
          sponsorship_date: string
        }
        Insert: {
          badge_awarded?: string | null
          created_at?: string
          film_given_id: string
          id?: string
          sponsor_id: string
          sponsored_user_id: string
          sponsorship_date?: string
        }
        Update: {
          badge_awarded?: string | null
          created_at?: string
          film_given_id?: string
          id?: string
          sponsor_id?: string
          sponsored_user_id?: string
          sponsorship_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_film_given_id_fkey"
            columns: ["film_given_id"]
            isOneToOne: false
            referencedRelation: "films_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_sponsored_user_id_fkey"
            columns: ["sponsored_user_id"]
            isOneToOne: true
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_film_exchange: {
        Args: { p_exchange_id: string; p_recipient_id: string }
        Returns: Json
      }
      admin_complete_deposit: {
        Args: { p_admin_id: string; p_deposit_id: string; p_movie_id: string }
        Returns: Json
      }
      admin_get_pending_deposits: {
        Args: { p_admin_id: string }
        Returns: {
          additional_notes: string
          deposit_id: string
          film_title: string
          sent_at: string
          status: string
          support_type: string
          tracking_number: string
          user_email: string
        }[]
      }
      admin_mark_deposit_received: {
        Args: { p_admin_id: string; p_deposit_id: string }
        Returns: Json
      }
      admin_reject_deposit: {
        Args: {
          p_admin_id: string
          p_deposit_id: string
          p_rejection_reason: string
        }
        Returns: Json
      }
      assign_welcome_film: { Args: { p_new_user_id: string }; Returns: Json }
      count_overdue_rentals: { Args: Record<string, never>; Returns: number }
      create_film_deposit: {
        Args: {
          p_additional_notes?: string
          p_film_title: string
          p_support_type: string
          p_tmdb_id?: number
          p_user_id: string
        }
        Returns: Json
      }
      expire_overdue_rentals: { Args: Record<string, never>; Returns: number }
      filter_directors_by_movies: {
        Args: {
          p_decade_end?: number
          p_decade_start?: number
          p_language?: string
        }
        Returns: {
          director_id: string
        }[]
      }
      generate_tracking_number: { Args: Record<string, never>; Returns: string }
      get_available_films_for_exchange: {
        Args: { p_user_id: string }
        Returns: {
          is_available: boolean
          movie_id: string
          movie_title: string
          owner_email: string
          owner_id: string
          physical_support_type: string
          registry_id: string
        }[]
      }
      get_film_owner: {
        Args: { p_registry_id: string }
        Returns: {
          acquisition_date: string
          acquisition_method: string
          owner_email: string
          owner_id: string
        }[]
      }
      get_film_ownership_history: {
        Args: { p_registry_id: string }
        Returns: {
          from_owner_email: string
          to_owner_email: string
          transfer_date: string
          transfer_id: string
          transfer_type: string
        }[]
      }
      get_my_sponsor: {
        Args: { p_user_id: string }
        Returns: {
          badge_awarded: string
          film_title: string
          sponsor_email: string
          sponsor_id: string
          sponsorship_date: string
        }[]
      }
      get_my_sponsored_users: {
        Args: { p_user_id: string }
        Returns: {
          film_title: string
          sponsored_user_email: string
          sponsored_user_id: string
          sponsorship_date: string
        }[]
      }
      get_user_badges: {
        Args: { p_user_id: string }
        Returns: {
          awarded_at: string
          badge_level: string
          sponsorship_count: number
        }[]
      }
      get_user_deposits: {
        Args: { p_user_id: string }
        Returns: {
          completed_at: string
          deposit_id: string
          film_title: string
          received_at: string
          rejection_reason: string
          sent_at: string
          status: string
          support_type: string
          tracking_number: string
        }[]
      }
      get_user_films: {
        Args: { p_user_id: string }
        Returns: {
          acquisition_date: string
          acquisition_method: string
          deposit_date: string
          movie_id: string
          movie_title: string
          physical_support_type: string
          registry_id: string
        }[]
      }
      get_user_highest_badge: { Args: { p_user_id: string }; Returns: string }
      instant_film_exchange: {
        Args: {
          p_offered_film_id: string
          p_payment_id?: string
          p_requested_film_id: string
          p_user_id: string
        }
        Returns: Json
      }
      refresh_random_order: { Args: Record<string, never>; Returns: undefined }
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
      show_limit: { Args: Record<string, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { text_input: string }; Returns: string }
      update_overdue_emprunts: { Args: Record<string, never>; Returns: undefined }
      update_sponsor_badge: { Args: { p_sponsor_id: string }; Returns: string }
      verify_legacy_cleanup: {
        Args: Record<string, never>
        Returns: {
          check_name: string
          item_exists: boolean
          status: string
        }[]
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
