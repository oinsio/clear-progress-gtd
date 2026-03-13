import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { router } from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <SyncProvider>
        <RouterProvider router={router} />
      </SyncProvider>
    </ThemeProvider>
  );
}
