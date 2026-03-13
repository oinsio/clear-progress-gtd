import { NavLink } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface SidebarMenuItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarMenuItem({ href, label, icon: Icon }: SidebarMenuItemProps) {
  return (
    <NavLink
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
  );
}
