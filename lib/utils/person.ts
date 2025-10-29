/**
 * Convertit un chemin de photo de personne (acteur/réalisateur) en URL complète
 * Gère 3 formats:
 * - URL complète (http/https) → retourne tel quel
 * - Chemin TMDB (commence par /) → préfixe avec URL TMDB
 * - Autre → retourne tel quel
 *
 * @param path - Chemin de la photo depuis la DB (photo_path)
 * @returns URL complète ou null si pas de photo
 */
export function getPersonPhotoUrl(path: string | null): string | null {
  if (!path) return null

  // URL complète déjà formée
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Chemin TMDB (format: /abc123.jpg)
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w185${path}`
  }

  // Autre format (stockage local, etc.)
  return path
}
