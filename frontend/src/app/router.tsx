import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants";
import { AppShell } from "@/components/layout/AppShell";
import { PageShell } from "@/components/layout/PageShell";
import InboxPage from "@/pages/InboxPage";
import TodayPage from "@/pages/TodayPage";
import WeekPage from "@/pages/WeekPage";
import LaterPage from "@/pages/LaterPage";
import GoalsPage from "@/pages/GoalsPage";
import GoalDetailPage from "@/pages/GoalDetailPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import ContextsPage from "@/pages/ContextsPage";
import ContextDetailPage from "@/pages/ContextDetailPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import SetupPage from "@/pages/SetupPage";

/** All routes share AppShell (provides SideNav on tablet/desktop) */
function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/** Today / Week / Later also wrap content in PageShell (adds BottomNav on mobile) */
function PageLayout() {
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
    element: <AppLayout />,
    children: [
      { path: ROUTES.SETUP, element: <SetupPage /> },
      { path: ROUTES.INBOX, element: <InboxPage /> },
      { path: ROUTES.CATEGORIES, element: <CategoriesPage /> },
      { path: ROUTES.CATEGORY, element: <CategoryDetailPage /> },
      { path: ROUTES.CONTEXTS, element: <ContextsPage /> },
      { path: ROUTES.CONTEXT, element: <ContextDetailPage /> },
      { path: ROUTES.SETTINGS, element: <SettingsPage /> },
      { path: ROUTES.GOALS, element: <GoalsPage /> },
      { path: ROUTES.GOAL, element: <GoalDetailPage /> },
      { path: ROUTES.SEARCH, element: <SearchPage /> },
      {
        element: <PageLayout />,
        children: [
          { path: ROUTES.TODAY, element: <TodayPage /> },
          { path: ROUTES.WEEK, element: <WeekPage /> },
          { path: ROUTES.LATER, element: <LaterPage /> },
        ],
      },
    ],
  },
]);
