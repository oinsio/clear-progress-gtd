import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import type { RightPanelMode } from "@/components/tasks/RightFilterPanel";

export function useRightPanelNavigation(): (newMode: RightPanelMode) => void {
  const navigate = useNavigate();

  return useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else if (newMode === "categories") {
        navigate(ROUTES.CATEGORIES);
      } else if (newMode === "contexts") {
        navigate(ROUTES.CONTEXTS);
      }
    },
    [navigate],
  );
}
