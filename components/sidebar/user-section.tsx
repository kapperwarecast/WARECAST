import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { NavLink } from "@/components/ui/nav-link"
import { AuthButton } from "@/components/auth/auth-button"
import { useUserDisplay } from "@/hooks/useUserDisplay"
import { AUTH_ITEMS } from "@/constants/navigation"
import { CSS_CLASSES } from "@/constants/theme"

interface UserSectionProps {
  onClose: () => void
}

export function UserSection({ onClose }: UserSectionProps) {
  const { user, initials, greetingMessage, email } = useUserDisplay()

  if (!user) return null

  return (
    <div className="mb-6">
      {/* Infos utilisateur */}
      <div className={CSS_CLASSES.userCard}>
        {initials ? (
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-zinc-700 text-zinc-200 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={CSS_CLASSES.avatar}>
            <User className="h-5 w-5 text-zinc-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{greetingMessage}</p>
          <p className="text-xs text-zinc-400 truncate">{email}</p>
        </div>
      </div>

      {/* Boutons utilisateur */}
      <div className="space-y-2">
        <NavLink
          href={AUTH_ITEMS.PROFILE.href}
          label={AUTH_ITEMS.PROFILE.label}
          icon={AUTH_ITEMS.PROFILE.icon}
          onClick={onClose}
        />

        <AuthButton
          variant="ghost"
          className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800 h-auto py-3 px-3 font-normal"
        />
      </div>

      <div className={CSS_CLASSES.separator}></div>
    </div>
  )
}