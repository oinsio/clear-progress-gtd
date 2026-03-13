import { Inbox, CalendarDays, Target, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";

const BOTTOM_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: ROUTES.INBOX, label: "Inbox", icon: Inbox },
  { href: ROUTES.TODAY, label: "Today", icon: CalendarDays },
  { href: ROUTES.GOALS, label: "Goals", icon: Target },
  { href: ROUTES.SEARCH, label: "Search", icon: Search },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      className="flex items-center justify-around border-t border-gray-200 bg-white px-2 py-2"
    >
      {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          aria-label={label}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              isActive && "bg-gray-100 text-gray-900",
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
