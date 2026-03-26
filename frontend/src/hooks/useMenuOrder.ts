import { useState, useCallback, useEffect, useRef } from "react";
import { STORAGE_KEYS, MENU_ORDER_CHANGED_EVENT } from "@/constants";
import type { MenuItemConfig, MenuMode } from "@/types/common";

const DEFAULT_MENU_MODE_ORDER: MenuMode[] = [
  "inbox",
  "contexts",
  "categories",
  "goals",
  "tasks",
  "completed",
  "deleted",
];

const DEFAULT_MENU_ORDER: MenuItemConfig[] = [
  ...DEFAULT_MENU_MODE_ORDER.filter((mode) => mode !== "deleted").map((mode) => ({
    mode,
    visible: true,
  })),
  { mode: "deleted", visible: false },
];

function loadMenuOrder(): MenuItemConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
    if (!stored) return DEFAULT_MENU_ORDER;
    const parsed = JSON.parse(stored) as MenuItemConfig[];
    const validModes = new Set<MenuMode>(DEFAULT_MENU_MODE_ORDER);
    const filtered = parsed.filter((item) => validModes.has(item.mode));
    const storedModes = new Set(filtered.map((item) => item.mode));
    const missing = DEFAULT_MENU_ORDER.filter((item) => !storedModes.has(item.mode));
    return [...filtered, ...missing];
  } catch {
    return DEFAULT_MENU_ORDER;
  }
}

export function useMenuOrder() {
  const [menuOrder, setMenuOrderState] = useState<MenuItemConfig[]>(loadMenuOrder);
  const shouldBroadcast = useRef(false);

  // Broadcast to other hook instances after state is committed to localStorage
  useEffect(() => {
    if (!shouldBroadcast.current) return;
    shouldBroadcast.current = false;
    window.dispatchEvent(new Event(MENU_ORDER_CHANGED_EVENT));
  }, [menuOrder]);

  // Listen for changes made by other hook instances
  useEffect(() => {
    const handleExternalChange = () => {
      setMenuOrderState(loadMenuOrder());
    };
    window.addEventListener(MENU_ORDER_CHANGED_EVENT, handleExternalChange);
    return () => window.removeEventListener(MENU_ORDER_CHANGED_EVENT, handleExternalChange);
  }, []);

  const setMenuOrder = useCallback(
    (updater: MenuItemConfig[] | ((prev: MenuItemConfig[]) => MenuItemConfig[])) => {
      shouldBroadcast.current = true;
      setMenuOrderState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return { menuOrder, setMenuOrder };
}
