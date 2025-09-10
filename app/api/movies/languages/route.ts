import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Récupérer toutes les langues uniques qui existent dans la base de données
    const { data: languages, error } = await supabase
      .from('movies')
      .select('langue_vo')
      .not('langue_vo', 'is', null)
      .not('langue_vo', 'eq', '')
    
    if (error) {
      console.error('Supabase error details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch languages', details: error.message },
        { status: 500 }
      )
    }
    
    // Extraire les langues uniques et les trier par nom français
    const uniqueLanguages = [...new Set(languages.map(l => l.langue_vo))]
      .filter(lang => lang) // Filtrer les valeurs nulles/undefined
      .sort((a, b) => {
        // Importer la fonction de mapping ici
        const getLanguageName = (langCode: string | null): string => {
          const languageMap: { [key: string]: string } = {
            'fr': 'français', 'en': 'anglais', 'es': 'espagnol', 'de': 'allemand', 'it': 'italien',
            'pt': 'portugais', 'ja': 'japonais', 'ko': 'coréen', 'zh': 'chinois', 'cn': 'chinois',
            'ar': 'arabe', 'ru': 'russe', 'hi': 'hindi', 'th': 'thaï', 'tr': 'turc',
            'pl': 'polonais', 'nl': 'néerlandais', 'sv': 'suédois', 'da': 'danois',
            'no': 'norvégien', 'fi': 'finnois', 'cs': 'tchèque', 'hu': 'hongrois',
            'ro': 'roumain', 'bg': 'bulgare', 'hr': 'croate', 'sk': 'slovaque',
            'sl': 'slovène', 'et': 'estonien', 'lv': 'letton', 'lt': 'lituanien',
            'mt': 'maltais', 'ga': 'irlandais', 'cy': 'gallois', 'eu': 'basque',
            'ca': 'catalan', 'gl': 'galicien', 'is': 'islandais', 'fo': 'féroïen',
            'he': 'hébreu', 'yi': 'yiddish', 'fa': 'persan', 'ur': 'ourdou',
            'bn': 'bengali', 'ta': 'tamoul', 'te': 'télougou', 'ml': 'malayalam',
            'kn': 'kannada', 'gu': 'gujarati', 'pa': 'pendjabi', 'or': 'odia',
            'as': 'assamais', 'ne': 'népalais', 'si': 'cingalais', 'my': 'birman',
            'km': 'khmer', 'lo': 'lao', 'vi': 'vietnamien', 'ms': 'malais',
            'id': 'indonésien', 'tl': 'tagalog', 'sw': 'swahili', 'am': 'amharique',
            'ha': 'haoussa', 'yo': 'yoruba', 'ig': 'igbo', 'zu': 'zoulou',
            'af': 'afrikaans', 'sq': 'albanais', 'hy': 'arménien', 'az': 'azéri',
            'be': 'biélorusse', 'bs': 'bosniaque', 'mk': 'macédonien', 'sr': 'serbe',
            'mn': 'mongol', 'ka': 'géorgien', 'kk': 'kazakh', 'ky': 'kirghiz',
            'tj': 'tadjik', 'tk': 'turkmène', 'uz': 'ouzbek'
          }
          if (!langCode) return ''
          return languageMap[langCode.toLowerCase()] || langCode.toUpperCase()
        }
        
        const nameA = getLanguageName(a)
        const nameB = getLanguageName(b)
        return nameA.localeCompare(nameB, 'fr')
      })
    
    return NextResponse.json({
      languages: uniqueLanguages
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}