import { NavLink } from "@/components/ui/nav-link"
import { AUTH_ITEMS } from "@/constants/navigation"
import { CSS_CLASSES } from "@/constants/theme"

interface AuthSectionProps {
  onClose: () => void
}

export function AuthSection({ onClose }: AuthSectionProps) {
  return (
    <div className="mb-6">
      {/* Message d'accueil */}
      <div className={CSS_CLASSES.welcomeMessage}>
        <p className="text-zinc-300 text-sm text-center">
          Connectez-vous pour accéder à toutes les fonctionnalités
        </p>
      </div>

      {/* Boutons d'authentification */}
      <div className="space-y-2">
        <NavLink
          href={AUTH_ITEMS.LOGIN.href}
          label={AUTH_ITEMS.LOGIN.label}
          icon={AUTH_ITEMS.LOGIN.icon}
          onClick={onClose}
        />

        <NavLink
          href={AUTH_ITEMS.SIGNUP.href}
          label={AUTH_ITEMS.SIGNUP.label}
          icon={AUTH_ITEMS.SIGNUP.icon}
          onClick={onClose}
        />
      </div>

      <div className={CSS_CLASSES.separator}></div>
    </div>
  )
}