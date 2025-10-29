/**
 * Crée une fonction debounced qui retarde l'invocation de `func`
 * jusqu'à ce que `delay` millisecondes se soient écoulées depuis
 * le dernier appel à la fonction debounced.
 *
 * @param func - La fonction à debounce
 * @param delay - Le délai en millisecondes (par défaut: 300ms)
 * @returns Une fonction debounced
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}
