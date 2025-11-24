/**
 * Utilitaires pour la génération et manipulation de slugs SEO-friendly
 */

/**
 * Convertit un texte en slug (minuscules, sans accents, avec tirets)
 * Gère les caractères français spéciaux
 *
 * @example
 * slugify("L'Été Indien") // "l-ete-indien"
 * slugify("C'est l'été!") // "c-est-l-ete"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    // Normaliser et supprimer les accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remplacer les caractères non alphanumériques par des tirets
    .replace(/[^a-z0-9]+/g, '-')
    // Supprimer les tirets au début et à la fin
    .replace(/^-+|-+$/g, '')
}

/**
 * Génère un slug pour un film basé sur le titre et l'année
 * Format: titre-année
 *
 * @example
 * generateFilmSlug({ titre_francais: "Inception", annee_sortie: 2010 }) // "inception-2010"
 */
export function generateFilmSlug(movie: {
  titre_francais: string | null
  titre_original: string | null
  annee_sortie: number | null
}): string {
  const title = movie.titre_francais || movie.titre_original || 'film'
  const slug = slugify(title)
  const year = movie.annee_sortie || 'sans-annee'

  return `${slug}-${year}`
}

/**
 * Génère un slug pour une personne (acteur/réalisateur) basé sur le nom complet
 * Format: nom-complet-slugifie
 *
 * @example
 * generatePersonSlug({ name: "Leonardo DiCaprio" }) // "leonardo-dicaprio"
 */
export function generatePersonSlug(person: {
  name?: string | null
  id?: string
}): string {
  if (person.name) {
    return slugify(person.name)
  }

  // Fallback avec ID si pas de nom disponible
  return `personne-${person.id?.substring(0, 8) || 'inconnu'}`
}

/**
 * Vérifie si une chaîne ressemble à un UUID
 * Utilisé pour détecter les anciennes URLs et les rediriger
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Extrait le type de personne et le slug d'une URL
 *
 * @example
 * parsePersonUrl("/personne/acteur/leonardo-dicaprio")
 * // { type: "acteur", slug: "leonardo-dicaprio" }
 */
export function parsePersonUrl(pathname: string): {
  type: 'acteur' | 'directeur' | null
  slug: string | null
} {
  const match = pathname.match(/\/personne\/(acteur|directeur)\/([^/?]+)/)

  if (!match) {
    return { type: null, slug: null }
  }

  return {
    type: match[1] as 'acteur' | 'directeur',
    slug: match[2]
  }
}
