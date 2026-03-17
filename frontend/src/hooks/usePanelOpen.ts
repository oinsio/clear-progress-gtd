import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";

function getCachedPanelOpen(): boolean {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.PANEL_OPEN);
    return cached === "true";
  } catch {
    // localStorage недоступен
  }
  return false;
}

export interface UsePanelOpenReturn {
  isPanelOpen: boolean;
  togglePanelOpen: () => void;
}

export function usePanelOpen(): UsePanelOpenReturn {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(getCachedPanelOpen);

  const togglePanelOpen = useCallback(() => {
    setIsPanelOpen((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, String(next));
      } catch {
        // localStorage недоступен
      }
      return next;
    });
  }, []);

  return { isPanelOpen, togglePanelOpen };
}
