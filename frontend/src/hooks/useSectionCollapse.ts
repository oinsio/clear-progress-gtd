import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";

function readCollapsedSections(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SECTION_COLLAPSE);
    if (stored !== null) {
      return JSON.parse(stored) as Record<string, boolean>;
    }
  } catch {
    // localStorage недоступен или данные повреждены
  }
  return {};
}

function writeCollapsedSections(sections: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SECTION_COLLAPSE, JSON.stringify(sections));
  } catch {
    // localStorage недоступен
  }
}

export interface UseSectionCollapseReturn {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function useSectionCollapse(sectionKey: string): UseSectionCollapseReturn {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const sections = readCollapsedSections();
    return sections[sectionKey] ?? false;
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((previous) => {
      const next = !previous;
      const sections = readCollapsedSections();
      sections[sectionKey] = next;
      writeCollapsedSections(sections);
      return next;
    });
  }, [sectionKey]);

  return { isCollapsed, toggleCollapse };
}
