/**
 * Type guard pour vérifier si une valeur unknown est un objet Error avec une propriété message
 * Utile pour gérer les erreurs Supabase RPC de manière type-safe
 */
export function isErrorWithMessage(
  error: unknown
): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

/**
 * Extrait un message d'erreur d'une valeur unknown
 * Retourne le message si disponible, sinon le fallback
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'Une erreur est survenue'
): string {
  if (isErrorWithMessage(error)) {
    return error.message
  }
  return fallback
}
