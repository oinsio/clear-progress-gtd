import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

function renderWithRouter(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("should render Inbox navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /inbox/i })).toBeInTheDocument();
  });

  it("should render Today navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /today/i })).toBeInTheDocument();
  });

  it("should render Week navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /week/i })).toBeInTheDocument();
  });

  it("should render Later navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /later/i })).toBeInTheDocument();
  });

  it("should render Goals navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /goals/i })).toBeInTheDocument();
  });

  it("should render Search navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
  });

  it("should render Settings navigation link", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("should mark Today as active when on /today route", () => {
    renderWithRouter(["/today"]);
    expect(screen.getByRole("link", { name: /today/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("should not mark Inbox as active when on /today route", () => {
    renderWithRouter(["/today"]);
    expect(screen.getByRole("link", { name: /inbox/i })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
