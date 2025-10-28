import { z } from 'zod'

/**
 * Schéma de validation des variables d'environnement
 * Garantit que toutes les variables critiques sont présentes au démarrage
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY est requise'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY est requise'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY doit commencer par sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY doit commencer par pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(), // Optional car peut ne pas être configuré en dev

  // TMDB (optionnel)
  TMDB_API_KEY: z.string().optional(),

  // Next.js (automatiques)
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
})

/**
 * Parse et valide les variables d'environnement
 * Lance une erreur explicite si une variable manque ou est invalide
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n')

      console.error('❌ Variables d\'environnement invalides ou manquantes:\n')
      console.error(missingVars)
      console.error('\n📝 Vérifiez votre fichier .env.local\n')

      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

/**
 * Variables d'environnement validées
 * Utilisez cet export au lieu de process.env pour la sécurité des types
 */
export const env = validateEnv()

/**
 * Type-safe access to environment variables
 */
export type Env = z.infer<typeof envSchema>
