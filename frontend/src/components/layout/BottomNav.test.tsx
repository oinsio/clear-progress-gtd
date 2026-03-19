import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";

function renderWithRouter(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe("BottomNav", () => {
  it("should render Inbox navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /входящие/i })).toBeInTheDocument();
  });

  it("should render Today navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /сегодня/i })).toBeInTheDocument();
  });

  it("should render Goals navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /цели/i })).toBeInTheDocument();
  });

  it("should render Search navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /поиск/i })).toBeInTheDocument();
  });

  it("should mark Inbox as active when on /inbox route", () => {
    renderWithRouter(["/inbox"]);
    expect(screen.getByRole("link", { name: /входящие/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("should not mark Today as active when on /inbox route", () => {
    renderWithRouter(["/inbox"]);
    expect(screen.getByRole("link", { name: /сегодня/i })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
