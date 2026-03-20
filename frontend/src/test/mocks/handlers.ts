import { http, HttpResponse } from "msw";

const GAS_URL = "https://script.google.com/macros/s/test-deploy-id/exec";

export const handlers = [
  http.get(GAS_URL, () => {
    return HttpResponse.json({ ok: true, app: "Clear Progress", version: "1.0", initialized: true });
  }),

  http.post(GAS_URL, async ({ request }) => {
    const body = (await request.json()) as { action: string };

    switch (body.action) {
      case "ping":
        return HttpResponse.json({ ok: true, app: "Clear Progress", version: "1.0", initialized: true });

      case "init":
        return HttpResponse.json({ ok: true });

      case "pull":
        return HttpResponse.json({
          ok: true,
          data: {
            tasks: [],
            goals: [],
            contexts: [],
            categories: [],
            checklist_items: [],
            settings: [],
          },
        });

      case "push":
        return HttpResponse.json({ ok: true, data: {} });

      default:
        return HttpResponse.json(
          { ok: false, error: "Unknown action" },
          { status: 400 },
        );
    }
  }),
];
