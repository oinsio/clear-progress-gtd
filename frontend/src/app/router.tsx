import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants";
import { PageShell } from "@/components/layout/PageShell";
import InboxPage from "@/pages/InboxPage";
import TodayPage from "@/pages/TodayPage";
import WeekPage from "@/pages/WeekPage";
import LaterPage from "@/pages/LaterPage";
import GoalsPage from "@/pages/GoalsPage";
import GoalPage from "@/pages/GoalPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import ContextsPage from "@/pages/ContextsPage";
import ContextDetailPage from "@/pages/ContextDetailPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import SetupPage from "@/pages/SetupPage";

function RootLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={ROUTES.INBOX} replace />,
  },
  {
    path: ROUTES.SETUP,
    element: <SetupPage />,
  },
  // Pages with their own full-screen layout (bottom filter bar + right panel)
  {
    path: ROUTES.INBOX,
    element: <InboxPage />,
  },
  {
    path: ROUTES.CATEGORIES,
    element: <CategoriesPage />,
  },
  {
    path: ROUTES.CATEGORY,
    element: <CategoryDetailPage />,
  },
  {
    path: ROUTES.CONTEXTS,
    element: <ContextsPage />,
  },
  {
    path: ROUTES.CONTEXT,
    element: <ContextDetailPage />,
  },
  {
    path: ROUTES.SETTINGS,
    element: <SettingsPage />,
  },
  {
    path: ROUTES.GOALS,
    element: <GoalsPage />,
  },
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.TODAY, element: <TodayPage /> },
      { path: ROUTES.WEEK, element: <WeekPage /> },
      { path: ROUTES.LATER, element: <LaterPage /> },
      { path: ROUTES.GOAL, element: <GoalPage /> },
      { path: ROUTES.SEARCH, element: <SearchPage /> },
    ],
  },
]);
