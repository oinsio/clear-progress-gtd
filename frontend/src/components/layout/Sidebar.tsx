import {
  Inbox,
  CalendarDays,
  CalendarRange,
  Clock,
  Target,
  Search,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { SidebarMenuItem } from "./SidebarMenuItem";

const NAV_ITEMS = [
  { href: ROUTES.INBOX, label: "Inbox", icon: Inbox },
  { href: ROUTES.TODAY, label: "Today", icon: CalendarDays },
  { href: ROUTES.WEEK, label: "Week", icon: CalendarRange },
  { href: ROUTES.LATER, label: "Later", icon: Clock },
  { href: ROUTES.GOALS, label: "Goals", icon: Target },
  { href: ROUTES.SEARCH, label: "Search", icon: Search },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full w-60 flex-col gap-1 border-r border-gray-200 bg-white px-3 py-4"
    >
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href} {...item} />
      ))}
    </nav>
  );
}
