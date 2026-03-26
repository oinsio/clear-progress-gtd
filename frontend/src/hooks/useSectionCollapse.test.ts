import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useSectionCollapse } from "./useSectionCollapse";
import { STORAGE_KEYS } from "@/constants";

describe("useSectionCollapse", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return false (expanded) by default", () => {
    const { result } = renderHook(() => useSectionCollapse("inbox"));
    expect(result.current.isCollapsed).toBe(false);
  });

  it("should return true after toggling", () => {
    const { result } = renderHook(() => useSectionCollapse("inbox"));
    act(() => {
      result.current.toggleCollapse();
    });
    expect(result.current.isCollapsed).toBe(true);
  });

  it("should return false after toggling twice", () => {
    const { result } = renderHook(() => useSectionCollapse("today"));
    act(() => {
      result.current.toggleCollapse();
    });
    act(() => {
      result.current.toggleCollapse();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it("should persist collapsed state to localStorage", () => {
    const { result } = renderHook(() => useSectionCollapse("week"));
    act(() => {
      result.current.toggleCollapse();
    });
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SECTION_COLLAPSE) ?? "{}",
    ) as Record<string, boolean>;
    expect(stored["week"]).toBe(true);
  });

  it("should read initial collapsed state from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEYS.SECTION_COLLAPSE,
      JSON.stringify({ later: true }),
    );
    const { result } = renderHook(() => useSectionCollapse("later"));
    expect(result.current.isCollapsed).toBe(true);
  });

  it("should return false for a key not in localStorage", () => {
    localStorage.setItem(
      STORAGE_KEYS.SECTION_COLLAPSE,
      JSON.stringify({ other: true }),
    );
    const { result } = renderHook(() => useSectionCollapse("inbox"));
    expect(result.current.isCollapsed).toBe(false);
  });

  it("should persist uncollapsed state when toggling back", () => {
    localStorage.setItem(
      STORAGE_KEYS.SECTION_COLLAPSE,
      JSON.stringify({ inbox: true }),
    );
    const { result } = renderHook(() => useSectionCollapse("inbox"));
    act(() => {
      result.current.toggleCollapse();
    });
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SECTION_COLLAPSE) ?? "{}",
    ) as Record<string, boolean>;
    expect(stored["inbox"]).toBe(false);
  });
});
