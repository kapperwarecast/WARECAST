// TMDB API Response Types

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  runtime: number
  genres: TMDBGenre[]
  original_language: string
  vote_average: number
  poster_path: string | null
  backdrop_path: string | null
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBCredits {
  id: number
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  order: number
  profile_path: string | null
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface TMDBPerson {
  id: number
  name: string
  profile_path: string | null
  biography: string
  birthday: string | null
  place_of_birth: string | null
  known_for_department: string
}

// Movie import types
export interface MovieImportRequest {
  tmdbIds: number[]
}

export interface MovieImportResult {
  success: boolean
  movieId?: string
  tmdbId: number
  title?: string
  error?: string
  actorsImported?: number
  directorsImported?: number
}

export interface ImportProgress {
  total: number
  completed: number
  current?: string
  results: MovieImportResult[]
}