export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) {
    return ''
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`
    } else {
      return `${hours}h`
    }
  } else {
    return `${remainingMinutes}min`
  }
}

// Language mapping
const languageMap: { [key: string]: string } = {
  'fr': 'français',
  'en': 'anglais',
  'es': 'espagnol',
  'de': 'allemand',
  'it': 'italien',
  'pt': 'portugais',
  'ja': 'japonais',
  'ko': 'coréen',
  'zh': 'chinois',
  'cn': 'chinois', // Code non-standard mais présent dans votre DB
  'ar': 'arabe',
  'ru': 'russe',
  'hi': 'hindi',
  'th': 'thaï',
  'tr': 'turc',
  'pl': 'polonais',
  'nl': 'néerlandais',
  'sv': 'suédois',
  'da': 'danois',
  'no': 'norvégien',
  'fi': 'finnois',
  'cs': 'tchèque',
  'hu': 'hongrois',
  'ro': 'roumain',
  'bg': 'bulgare',
  'hr': 'croate',
  'sk': 'slovaque',
  'sl': 'slovène',
  'et': 'estonien',
  'lv': 'letton',
  'lt': 'lituanien',
  'mt': 'maltais',
  'ga': 'irlandais',
  'cy': 'gallois',
  'eu': 'basque',
  'ca': 'catalan',
  'gl': 'galicien',
  'is': 'islandais',
  'fo': 'féroïen',
  'he': 'hébreu',
  'yi': 'yiddish',
  'fa': 'persan',
  'ur': 'ourdou',
  'bn': 'bengali',
  'ta': 'tamoul',
  'te': 'télougou',
  'ml': 'malayalam',
  'kn': 'kannada',
  'gu': 'gujarati',
  'pa': 'pendjabi',
  'or': 'odia',
  'as': 'assamais',
  'ne': 'népalais',
  'si': 'cingalais',
  'my': 'birman',
  'km': 'khmer',
  'lo': 'lao',
  'vi': 'vietnamien',
  'ms': 'malais',
  'id': 'indonésien',
  'tl': 'tagalog',
  'sw': 'swahili',
  'am': 'amharique',
  'ha': 'haoussa',
  'yo': 'yoruba',
  'ig': 'igbo',
  'zu': 'zoulou',
  'af': 'afrikaans',
  'sq': 'albanais',
  'hy': 'arménien',
  'az': 'azéri',
  'be': 'biélorusse',
  'bs': 'bosniaque',
  'mk': 'macédonien',
  'sr': 'serbe',
  'mn': 'mongol',
  'ka': 'géorgien',
  'kk': 'kazakh',
  'ky': 'kirghiz',
  'tj': 'tadjik',
  'tk': 'turkmène',
  'uz': 'ouzbek'
}

export function getLanguageName(langCode: string | null): string {
  if (!langCode) return ''
  return languageMap[langCode.toLowerCase()] || langCode.toUpperCase()
}

