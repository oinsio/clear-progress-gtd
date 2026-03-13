import { Inbox, CalendarDays, Target, Search } from "lucide-react";
import { ROUTES } from "@/constants";
import { SidebarMenuItem } from "./SidebarMenuItem";

const BOTTOM_NAV_ITEMS = [
  { href: ROUTES.INBOX, label: "Inbox", icon: Inbox },
  { href: ROUTES.TODAY, label: "Today", icon: CalendarDays },
  { href: ROUTES.GOALS, label: "Goals", icon: Target },
  { href: ROUTES.SEARCH, label: "Search", icon: Search },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      className="flex items-center justify-around border-t border-gray-200 bg-white px-2 py-2"
    >
      {BOTTOM_NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href} {...item} />
      ))}
    </nav>
  );
}
