import { type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useActiveRoute } from "@/hooks/useActiveRoute"
import { getButtonStyles } from "@/constants/theme"

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
  exact?: boolean
}

export function NavLink({ href, label, icon: Icon, onClick, exact = true }: NavLinkProps) {
  const { isRouteActive } = useActiveRoute()
  const isActive = isRouteActive(href, exact)

  return (
    <Button
      asChild
      variant="ghost"
      className={getButtonStyles(isActive)}
      onClick={onClick}
    >
      <Link href={href}>
        <Icon className="h-5 w-5 mr-3" />
        {label}
      </Link>
    </Button>
  )
}