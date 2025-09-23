// Centralisation des couleurs et styles du thème
export const THEME = {
  colors: {
    primary: {
      DEFAULT: 'orange-500',
      hover: 'orange-400'
    },
    text: {
      primary: 'white',
      secondary: 'zinc-300',
      muted: 'zinc-400'
    },
    background: {
      primary: 'black',
      secondary: 'zinc-900',
      muted: 'zinc-800'
    },
    border: {
      DEFAULT: 'zinc-800',
      muted: 'zinc-700'
    }
  },
  styles: {
    button: {
      base: "w-full justify-start",
      inactive: "text-zinc-300 hover:text-white hover:bg-zinc-800",
      active: "text-orange-500 hover:text-orange-400 hover:bg-zinc-800"
    }
  }
} as const

// Helpers pour construire les classes CSS
export const getButtonStyles = (isActive: boolean) => {
  const { base, inactive, active } = THEME.styles.button
  return `${base} ${isActive ? active : inactive}`
}

// Classes CSS réutilisables
export const CSS_CLASSES = {
  separator: "border-t border-zinc-800 my-4",
  userCard: "flex items-center space-x-3 mb-4 p-3 bg-zinc-800/50 rounded-lg",
  welcomeMessage: "mb-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-800",
  avatar: "h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center"
} as const