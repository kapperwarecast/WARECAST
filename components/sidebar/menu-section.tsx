import { NavLink } from "@/components/ui/nav-link"
import { useUserDisplay } from "@/hooks/useUserDisplay"
import { type NavSection } from "@/constants/navigation"
import { CSS_CLASSES } from "@/constants/theme"

interface MenuSectionProps {
  section: NavSection
  onClose: () => void
}

export function MenuSection({ section, onClose }: MenuSectionProps) {
  const { isAuthenticated } = useUserDisplay()

  // Ne pas afficher la section si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (section.requiresAuth && !isAuthenticated) {
    return null
  }

  return (
    <>
      {section.items.map(item => {
        // Ne pas afficher l'item si l'authentification est requise mais l'utilisateur n'est pas connecté
        if (item.requiresAuth && !isAuthenticated) {
          return null
        }

        return (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onClick={onClose}
            exact={!item.href.startsWith('/admin')} // Les routes admin utilisent startsWith
          />
        )
      })}

      {section.showSeparatorAfter && isAuthenticated && (
        <div className={CSS_CLASSES.separator}></div>
      )}
    </>
  )
}