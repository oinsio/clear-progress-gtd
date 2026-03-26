import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { FILTER_ITEMS } from "@/components/tasks/RightFilterPanel";
import type { RightPanelMode } from "@/components/tasks/RightFilterPanel";

export function useRightPanelNavigation(): (newMode: RightPanelMode) => void {
  const navigate = useNavigate();

  return useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === null) return;
      if (newMode === "search") {
        navigate(ROUTES.SEARCH);
        return;
      }
      const filterItem = FILTER_ITEMS.find((item) => item.mode === newMode);
      if (filterItem?.route) {
        navigate(filterItem.route);
      } else {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      }
    },
    [navigate],
  );
}
