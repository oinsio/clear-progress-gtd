import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalCoverPicker } from "./GoalCoverPicker";

beforeEach(() => {
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:fake-object-url");
  global.URL.revokeObjectURL = vi.fn();
});

describe("GoalCoverPicker", () => {
  it("should show default cover image when previewSrc is null", () => {
    render(
      <GoalCoverPicker previewSrc={null} onFileSelect={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByTestId("cover-default-img")).toBeInTheDocument();
  });

  it("should show cover image when previewSrc is provided", () => {
    render(
      <GoalCoverPicker
        previewSrc="https://example.com/cover.jpg"
        onFileSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const img = screen.getByTestId("cover-preview-img");
    expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("should not show remove button when previewSrc is null", () => {
    render(
      <GoalCoverPicker previewSrc={null} onFileSelect={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.queryByTestId("cover-remove-button")).not.toBeInTheDocument();
  });

  it("should show remove button when previewSrc is set", () => {
    render(
      <GoalCoverPicker
        previewSrc="https://example.com/cover.jpg"
        onFileSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId("cover-remove-button")).toBeInTheDocument();
  });

  it("should call onRemove when remove button is clicked", async () => {
    const onRemove = vi.fn();
    render(
      <GoalCoverPicker
        previewSrc="https://example.com/cover.jpg"
        onFileSelect={vi.fn()}
        onRemove={onRemove}
      />,
    );
    await userEvent.click(screen.getByTestId("cover-remove-button"));
    expect(onRemove).toHaveBeenCalled();
  });

  it("should trigger file input click when picker button is clicked", async () => {
    render(
      <GoalCoverPicker previewSrc={null} onFileSelect={vi.fn()} onRemove={vi.fn()} />,
    );
    const input = screen.getByTestId("cover-file-input");
    const clickSpy = vi.spyOn(input, "click");
    await userEvent.click(screen.getByTestId("cover-picker-button"));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should call onFileSelect with selected file when valid image is chosen", async () => {
    const onFileSelect = vi.fn();
    render(
      <GoalCoverPicker previewSrc={null} onFileSelect={onFileSelect} onRemove={vi.fn()} />,
    );
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByTestId("cover-file-input");
    await userEvent.upload(input, file);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("should not call onFileSelect when no file is selected", async () => {
    const onFileSelect = vi.fn();
    render(
      <GoalCoverPicker previewSrc={null} onFileSelect={onFileSelect} onRemove={vi.fn()} />,
    );
    const input = screen.getByTestId("cover-file-input");
    await userEvent.upload(input, []);
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
