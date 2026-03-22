import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/drive\.google\.com\/thumbnail/,
            handler: "CacheFirst" as const,
            options: {
              cacheName: "cover-images",
              plugins: [
                {
                  cacheWillUpdate: async ({ response }: { response: Response }) => {
                    if (response && (response.status === 200 || response.type === "opaque")) {
                      return response;
                    }
                    return null;
                  },
                },
              ],
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      exclude: [
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.test.{ts,tsx}",
      ],
      thresholds: {
        statements: 70,
        lines: 70,
        functions: 70,
        branches: 65,
      },
    },
  },
});
