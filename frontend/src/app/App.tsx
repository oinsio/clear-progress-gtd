import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { router } from "./router";

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SyncProvider>
          <RouterProvider router={router} />
        </SyncProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
