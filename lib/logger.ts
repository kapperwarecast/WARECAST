/**
 * Logger conditionnel pour éviter les logs en production
 * Utiliser à la place de console.log/console.error
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log général - uniquement en développement
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log d'informations - uniquement en développement
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Warning - toujours loggé (important pour debug production)
   */
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },

  /**
   * Erreur - toujours loggée (critique pour monitoring)
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },

  /**
   * Debug détaillé - uniquement en développement
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log de groupe - uniquement en développement
   */
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  },
}

/**
 * Helper pour logger les performances
 */
export const logPerformance = (label: string, fn: () => void) => {
  if (isDevelopment) {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
  } else {
    fn()
  }
}
