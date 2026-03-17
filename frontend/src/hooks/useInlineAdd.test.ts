import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useInlineAdd } from "./useInlineAdd";
import * as React from "react";

describe("useInlineAdd", () => {
  it("should have isAdding false on initial render", () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineAdd(onCreate));
    expect(result.current.isAdding).toBe(false);
  });

  it("should have empty value on initial render", () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineAdd(onCreate));
    expect(result.current.value).toBe("");
  });

  it("should set isAdding to true when setIsAdding(true) is called", () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineAdd(onCreate));

    act(() => {
      result.current.setIsAdding(true);
    });

    expect(result.current.isAdding).toBe(true);
  });

  it("should update value when setValue is called", () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineAdd(onCreate));

    act(() => {
      result.current.setValue("New task");
    });

    expect(result.current.value).toBe("New task");
  });

  describe("handleKeyDown", () => {
    it("should call onCreate and reset state when Enter is pressed with non-empty value", async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setValue("My new task");
        result.current.setIsAdding(true);
      });

      await act(async () => {
        result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("My new task");
      expect(result.current.value).toBe("");
      expect(result.current.isAdding).toBe(false);
    });

    it.each(["", "   ", "  \t  "])("should not call onCreate when Enter is pressed with blank value %j", async (blankValue) => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setValue(blankValue);
      });

      await act(async () => {
        result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
        await Promise.resolve();
      });

      expect(onCreate).not.toHaveBeenCalled();
    });

    it("should set isAdding to false and clear value when Escape is pressed", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("Some text");
      });

      act(() => {
        result.current.handleKeyDown({ key: "Escape" } as React.KeyboardEvent);
      });

      expect(result.current.isAdding).toBe(false);
      expect(result.current.value).toBe("");
    });

    it("should not call onCreate when Escape is pressed", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setValue("Some text");
      });

      act(() => {
        result.current.handleKeyDown({ key: "Escape" } as React.KeyboardEvent);
      });

      expect(onCreate).not.toHaveBeenCalled();
    });

    it("should not react to other keys", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setValue("Some text");
        result.current.setIsAdding(true);
      });

      act(() => {
        result.current.handleKeyDown({ key: "Tab" } as React.KeyboardEvent);
      });

      expect(onCreate).not.toHaveBeenCalled();
      expect(result.current.isAdding).toBe(true);
      expect(result.current.value).toBe("Some text");
    });

    it("should trim value before calling onCreate", async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setValue("  My task  ");
      });

      await act(async () => {
        result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("My task");
    });
  });

  describe("handleBlur", () => {
    it("should set isAdding to false when value is empty", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isAdding).toBe(false);
    });

    it("should not close when value is non-empty", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("Some text");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isAdding).toBe(true);
    });

    it("should set isAdding to false when value is only whitespace", () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInlineAdd(onCreate));

      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("   ");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isAdding).toBe(false);
    });
  });
});
