import { useState, useCallback, useRef } from "react";
import type * as React from "react";
import {
  STORAGE_KEYS,
  PANEL_SPLIT_DEFAULT_RATIO,
  PANEL_SPLIT_MIN_RATIO,
  PANEL_SPLIT_MAX_RATIO,
} from "@/constants";

function clampRatio(value: number): number {
  return Math.min(PANEL_SPLIT_MAX_RATIO, Math.max(PANEL_SPLIT_MIN_RATIO, value));
}

function readStoredRatio(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PANEL_SPLIT);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return clampRatio(parsed);
    }
  } catch {
    // localStorage unavailable
  }
  return PANEL_SPLIT_DEFAULT_RATIO;
}

export function usePanelSplit() {
  const [ratio, setRatioState] = useState<number>(readStoredRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const setRatio = useCallback((newRatio: number) => {
    const clamped = clampRatio(newRatio);
    setRatioState(clamped);
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_SPLIT, String(clamped));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const containerRect = container.getBoundingClientRect();
        const newRatio = (moveEvent.clientX - containerRect.left) / containerRect.width;
        setRatio(newRatio);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setRatio],
  );

  return { ratio, setRatio, containerRef, handleResizeMouseDown };
}
