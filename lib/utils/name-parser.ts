/**
 * Utilitaire pour analyser et séparer les noms complets en nom et prénom
 * Spécialement conçu pour gérer les formats de noms provenant de TMDB
 */

export interface ParsedName {
  prenom: string
  nom: string
  nomComplet: string
}

/**
 * Liste des particules courantes dans les noms
 * (de, da, von, van, etc.)
 */
const PARTICULES = [
  'de', 'da', 'di', 'du', 'des', 'del', 'della', 'dello',
  'von', 'van', 'van der', 'van den',
  'le', 'la', 'les',
  'o\'', 'mc', 'mac',
  'al', 'el',
  'ben', 'ibn',
  'saint', 'st', 'ste'
]

/**
 * Sépare intelligemment un nom complet en prénom et nom
 * 
 * Exemples :
 * - "Tom Cruise" → { prenom: "Tom", nom: "Cruise" }
 * - "Jean-Claude Van Damme" → { prenom: "Jean-Claude", nom: "Van Damme" }
 * - "Robert De Niro" → { prenom: "Robert", nom: "De Niro" }
 * - "Leonardo DiCaprio" → { prenom: "Leonardo", nom: "DiCaprio" }
 */
export function parseName(fullName: string): ParsedName {
  if (!fullName?.trim()) {
    return {
      prenom: '',
      nom: '',
      nomComplet: fullName || ''
    }
  }

  const nomComplet = fullName.trim()
  
  // Séparer les mots
  const mots = nomComplet.split(/\s+/).filter(mot => mot.length > 0)
  
  if (mots.length === 0) {
    return { prenom: '', nom: '', nomComplet }
  }
  
  if (mots.length === 1) {
    // Un seul mot, on considère que c'est le nom
    return { prenom: '', nom: mots[0], nomComplet }
  }
  
  if (mots.length === 2) {
    // Cas simple : Prénom Nom
    return {
      prenom: mots[0],
      nom: mots[1],
      nomComplet
    }
  }
  
  // Cas complexe : plusieurs mots
  // On cherche les particules pour déterminer où commence le nom
  let indexDebutNom = 1 // Par défaut, le nom commence au 2ème mot
  
  for (let i = 1; i < mots.length; i++) {
    const mot = mots[i].toLowerCase()
    
    // Vérifier si c'est une particule
    if (PARTICULES.includes(mot) || PARTICULES.includes(mot.replace(/[.']/g, ''))) {
      indexDebutNom = i
      break
    }
    
    // Cas spécial : mots avec apostrophe (O'Neill, D'Angelo)
    if (mot.includes("'") && mot.length <= 4) {
      indexDebutNom = i
      break
    }
    
    // Cas spécial : initiales suivies d'un point (J.K. Rowling)
    if (mot.match(/^[A-Z]\.?$/) && i < mots.length - 1) {
      continue // C'est probablement une initiale du prénom
    }
  }
  
  // Gérer les prénoms composés avec tiret (Jean-Claude, Marie-Antoinette)
  const prenom = mots.slice(0, indexDebutNom).join(' ')
  const nom = mots.slice(indexDebutNom).join(' ')
  
  return {
    prenom: prenom.trim(),
    nom: nom.trim(),
    nomComplet
  }
}

/**
 * Fonction utilitaire pour nettoyer et formater un nom
 */
export function cleanName(name: string): string {
  if (!name) return ''
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s\-'\.àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/gi, '') // Garder seulement les caractères valides
}

/**
 * Exemples de tests pour validation
 */
export const EXEMPLES_NOMS = [
  // Noms simples
  { input: 'Tom Cruise', expected: { prenom: 'Tom', nom: 'Cruise' } },
  { input: 'Leonardo DiCaprio', expected: { prenom: 'Leonardo', nom: 'DiCaprio' } },
  
  // Noms avec particules
  { input: 'Robert De Niro', expected: { prenom: 'Robert', nom: 'De Niro' } },
  { input: 'Jean-Claude Van Damme', expected: { prenom: 'Jean-Claude', nom: 'Van Damme' } },
  { input: 'Benicio del Toro', expected: { prenom: 'Benicio', nom: 'del Toro' } },
  
  // Noms avec apostrophe
  { input: "Scarlett O'Hara", expected: { prenom: 'Scarlett', nom: "O'Hara" } },
  { input: "Connor McGregor", expected: { prenom: 'Connor', nom: 'McGregor' } },
  
  // Noms complexes
  { input: 'Helena Bonham Carter', expected: { prenom: 'Helena', nom: 'Bonham Carter' } },
  { input: 'Sarah Jessica Parker', expected: { prenom: 'Sarah Jessica', nom: 'Parker' } },
  
  // Cas limite
  { input: 'Cher', expected: { prenom: '', nom: 'Cher' } },
  { input: '', expected: { prenom: '', nom: '' } }
]