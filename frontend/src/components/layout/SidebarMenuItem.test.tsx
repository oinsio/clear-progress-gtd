import { type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Inbox } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";

function renderWithRouter(ui: ReactElement, initialEntries = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe("SidebarMenuItem", () => {
  it("should render the label text", () => {
    renderWithRouter(
      <SidebarMenuItem href="/inbox" label="Inbox" icon={Inbox} />,
    );

    expect(screen.getByText("Inbox")).toBeInTheDocument();
  });

  it("should render as a link with the correct href", () => {
    renderWithRouter(
      <SidebarMenuItem href="/inbox" label="Inbox" icon={Inbox} />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/inbox");
  });

  it("should set aria-current='page' when route matches", () => {
    renderWithRouter(
      <SidebarMenuItem href="/inbox" label="Inbox" icon={Inbox} />,
      ["/inbox"],
    );

    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });

  it("should not set aria-current when route does not match", () => {
    renderWithRouter(
      <SidebarMenuItem href="/inbox" label="Inbox" icon={Inbox} />,
      ["/today"],
    );

    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
  });
});
