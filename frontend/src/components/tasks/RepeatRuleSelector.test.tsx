import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RepeatRuleSelector } from "./RepeatRuleSelector";
import type { RepeatRule } from "@/types/common";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && Object.keys(options).length > 0) return `${key}:${JSON.stringify(options)}`;
      return key;
    },
  }),
}));

describe("RepeatRuleSelector", () => {
  const onChangeMock = vi.fn();
  const onBackMock = vi.fn();

  const defaultProps = {
    value: null,
    onChange: onChangeMock,
    onBack: onBackMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all repeat type options", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    expect(screen.getByTestId("repeat-option-none")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-option-daily")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-option-weekdays")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-option-weekly")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-option-monthly")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-option-interval")).toBeInTheDocument();
  });

  it("should call onChange(null) and onBack when none is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-none"));
    expect(onChangeMock).toHaveBeenCalledWith(null);
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should call onChange with daily rule and onBack when daily is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-daily"));
    expect(onChangeMock).toHaveBeenCalledWith({ type: "daily" });
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should call onChange with weekdays rule and onBack when weekdays is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekdays"));
    expect(onChangeMock).toHaveBeenCalledWith({ type: "weekdays" });
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should call onChange with monthly rule and onBack when monthly is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-monthly"));
    expect(onChangeMock).toHaveBeenCalledWith({ type: "monthly" });
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should show weekly days picker when weekly is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    expect(screen.getByTestId("repeat-weekly-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("repeat-option-daily")).not.toBeInTheDocument();
  });

  it("should render 7 day buttons in weekly picker", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    for (let day = 1; day <= 7; day++) {
      expect(screen.getByTestId(`repeat-day-${day}`)).toBeInTheDocument();
    }
  });

  it("should toggle day selection in weekly picker", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    const mondayButton = screen.getByTestId("repeat-day-1");
    fireEvent.click(mondayButton);
    expect(mondayButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(mondayButton);
    expect(mondayButton).toHaveAttribute("aria-pressed", "false");
  });

  it("should call onChange with selected days and onBack when weekly apply is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    fireEvent.click(screen.getByTestId("repeat-day-1"));
    fireEvent.click(screen.getByTestId("repeat-day-3"));
    fireEvent.click(screen.getByTestId("repeat-weekly-apply"));
    expect(onChangeMock).toHaveBeenCalledWith({ type: "weekly", days: [1, 3] });
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should go back to main view from weekly picker when back is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    fireEvent.click(screen.getByTestId("repeat-picker-back"));
    expect(screen.getByTestId("repeat-option-daily")).toBeInTheDocument();
    expect(screen.queryByTestId("repeat-weekly-picker")).not.toBeInTheDocument();
  });

  it("should show interval picker when interval is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-interval"));
    expect(screen.getByTestId("repeat-interval-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("repeat-option-daily")).not.toBeInTheDocument();
  });

  it("should call onChange with interval and onBack when interval apply is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-interval"));
    const input = screen.getByTestId("repeat-interval-input");
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.click(screen.getByTestId("repeat-interval-apply"));
    expect(onChangeMock).toHaveBeenCalledWith({ type: "interval", interval: 7 });
    expect(onBackMock).toHaveBeenCalled();
  });

  it("should go back to main view from interval picker when back is clicked", () => {
    render(<RepeatRuleSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("repeat-option-interval"));
    fireEvent.click(screen.getByTestId("repeat-picker-back"));
    expect(screen.getByTestId("repeat-option-daily")).toBeInTheDocument();
    expect(screen.queryByTestId("repeat-interval-picker")).not.toBeInTheDocument();
  });

  it("should pre-select days when value is a weekly rule", () => {
    const weeklyValue: RepeatRule = { type: "weekly", days: [2, 5] };
    render(<RepeatRuleSelector {...defaultProps} value={weeklyValue} />);
    fireEvent.click(screen.getByTestId("repeat-option-weekly"));
    expect(screen.getByTestId("repeat-day-2")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("repeat-day-5")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("repeat-day-1")).toHaveAttribute("aria-pressed", "false");
  });

  it("should pre-fill interval when value is an interval rule", () => {
    const intervalValue: RepeatRule = { type: "interval", interval: 14 };
    render(<RepeatRuleSelector {...defaultProps} value={intervalValue} />);
    fireEvent.click(screen.getByTestId("repeat-option-interval"));
    expect(screen.getByTestId("repeat-interval-input")).toHaveValue(14);
  });

  it("should highlight currently selected option", () => {
    const dailyValue: RepeatRule = { type: "daily" };
    render(<RepeatRuleSelector {...defaultProps} value={dailyValue} />);
    expect(screen.getByTestId("repeat-option-daily")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("repeat-option-weekdays")).toHaveAttribute("aria-pressed", "false");
  });
});
