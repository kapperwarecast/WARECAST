// Centralisation de toutes les routes de l'application
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  ADMIN: '/admin',
  HELP: '/help',
  SEND_MOVIE: '/send-movie',
  FAVORITES: '/favorites',
  WATCHED: '/watched',
  FILMS_EN_COURS: '/films-en-cours',
  REALISATEURS: '/realisateurs',
  FORMULES: '/formules',
  CONTACT: '/contact',
  CGU_CGV: '/cgu-cgv',
  MENTIONS_LEGALES: '/mentions-legales',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
  }
} as const

// Types pour une meilleure autocomplétion
export type Route = typeof ROUTES[keyof typeof ROUTES]
export type AuthRoute = typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH]