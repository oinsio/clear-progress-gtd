import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageShell } from "./PageShell";

function renderWithRouter(children: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PageShell>{children}</PageShell>
    </MemoryRouter>,
  );
}

describe("PageShell", () => {
  it("should render children", () => {
    renderWithRouter(<div>Page content</div>);
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("should render BottomNav for mobile navigation", () => {
    renderWithRouter(<div>Content</div>);
    expect(screen.getByRole("navigation", { name: /bottom navigation/i })).toBeInTheDocument();
  });
});
