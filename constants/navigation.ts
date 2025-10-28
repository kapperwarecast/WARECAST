import {
  Settings,
  User,
  HelpCircle,
  Film,
  Upload,
  Heart,
  Check,
  ShoppingCart,
  Clock,
  CreditCard,
  UserPlus,
  type LucideIcon
} from "lucide-react"
import { ROUTES } from "./routes"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  requiresAuth: boolean
  alwaysVisible?: boolean
}

export interface NavSection {
  id: string
  title?: string
  items: NavItem[]
  requiresAuth: boolean
  showSeparatorAfter?: boolean
}

// Configuration des éléments de navigation
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'catalog',
    label: 'Catalogue',
    href: ROUTES.HOME,
    icon: Film,
    requiresAuth: false,
    alwaysVisible: true
  },
  {
    id: 'films-en-cours',
    label: 'Films en cours',
    href: ROUTES.FILMS_EN_COURS,
    icon: Clock,
    requiresAuth: true
  },
  {
    id: 'favorites',
    label: 'Mes favoris',
    href: ROUTES.FAVORITES,
    icon: Heart,
    requiresAuth: true
  },
  {
    id: 'watched',
    label: 'Déjà visionné',
    href: ROUTES.WATCHED,
    icon: Check,
    requiresAuth: true
  },
  {
    id: 'subscription',
    label: 'Formules',
    href: ROUTES.FORMULES,
    icon: CreditCard,
    requiresAuth: true
  },
  {
    id: 'help',
    label: 'Comment ça marche',
    href: ROUTES.HELP,
    icon: HelpCircle,
    requiresAuth: false
  },
  {
    id: 'send-movie',
    label: 'Envoyer un film',
    href: ROUTES.SEND_MOVIE,
    icon: Upload,
    requiresAuth: true
  },
  {
    id: 'buy-movie',
    label: 'Acheter un film',
    href: ROUTES.BUY_MOVIE,
    icon: ShoppingCart,
    requiresAuth: true
  },
  {
    id: 'admin',
    label: 'Administration',
    href: ROUTES.ADMIN,
    icon: Settings,
    requiresAuth: true
  }
]

// Configuration des sections organisées
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    items: [
      NAV_ITEMS.find(item => item.id === 'catalog')!,
      NAV_ITEMS.find(item => item.id === 'films-en-cours')!
    ],
    requiresAuth: false
  },
  {
    id: 'collections',
    items: [
      NAV_ITEMS.find(item => item.id === 'favorites')!,
      NAV_ITEMS.find(item => item.id === 'watched')!
    ],
    requiresAuth: true,
    showSeparatorAfter: true
  },
  {
    id: 'services',
    items: [
      NAV_ITEMS.find(item => item.id === 'subscription')!,
      NAV_ITEMS.find(item => item.id === 'help')!,
      NAV_ITEMS.find(item => item.id === 'send-movie')!,
      NAV_ITEMS.find(item => item.id === 'buy-movie')!
    ],
    requiresAuth: false,
    showSeparatorAfter: true
  },
  {
    id: 'admin',
    items: [NAV_ITEMS.find(item => item.id === 'admin')!],
    requiresAuth: true
  }
]

// Configuration des éléments d'authentification
export interface AuthItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

export const AUTH_ITEMS = {
  PROFILE: {
    id: 'profile',
    label: 'Info compte',
    href: ROUTES.PROFILE,
    icon: User
  },
  LOGIN: {
    id: 'login',
    label: 'Se connecter',
    href: ROUTES.AUTH.LOGIN,
    icon: User
  },
  SIGNUP: {
    id: 'signup',
    label: "S'inscrire",
    href: ROUTES.AUTH.SIGNUP,
    icon: UserPlus
  }
} as const