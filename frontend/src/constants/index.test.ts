import { describe, it, expect } from "vitest";
import {
  ROUTES,
  BOX,
  BOX_ORDER,
  BOX_FILTER_ALL,
  BOX_FILTER_LABELS,
  TASK_BOX_FILTER_ORDER,
  DEFAULT_ACCENT_COLOR,
  ACCENT_COLORS,
  ACCENT_COLOR_VALUES,
  API_ACTIONS,
  SYNC_INTERVAL_MS,
  SYNC_DEBOUNCE_MS,
  DB_NAME,
  DB_VERSION,
  STORAGE_KEYS,
  SETTING_KEYS,
  MAX_COVER_SIZE_BYTES,
  PUSH_RESULT_STATUS,
  REPEAT_RULE_TYPE,
  DEFAULT_PANEL_SIDE,
  PANEL_SIDES,
} from "./index";

describe("ROUTES", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(ROUTES)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  it("should define INBOX as /inbox", () => {
    expect(ROUTES.INBOX).toBe("/inbox");
  });

  it("should define TODAY as /today", () => {
    expect(ROUTES.TODAY).toBe("/today");
  });

  it("should define WEEK as /week", () => {
    expect(ROUTES.WEEK).toBe("/week");
  });

  it("should define LATER as /later", () => {
    expect(ROUTES.LATER).toBe("/later");
  });

  it("should define GOALS as /goals", () => {
    expect(ROUTES.GOALS).toBe("/goals");
  });

  it("should define SETTINGS as /settings", () => {
    expect(ROUTES.SETTINGS).toBe("/settings");
  });

  it("should define SETUP as /setup", () => {
    expect(ROUTES.SETUP).toBe("/setup");
  });
});

describe("BOX", () => {
  it("should define INBOX as 'inbox'", () => {
    expect(BOX.INBOX).toBe("inbox");
  });

  it("should define TODAY as 'today'", () => {
    expect(BOX.TODAY).toBe("today");
  });

  it("should define WEEK as 'week'", () => {
    expect(BOX.WEEK).toBe("week");
  });

  it("should define LATER as 'later'", () => {
    expect(BOX.LATER).toBe("later");
  });

  it("should have 4 box values", () => {
    expect(Object.keys(BOX)).toHaveLength(4);
  });
});

describe("BOX_ORDER", () => {
  it("should be an array with 4 elements", () => {
    expect(BOX_ORDER).toHaveLength(4);
  });

  it("should contain all box values", () => {
    expect(BOX_ORDER).toContain("inbox");
    expect(BOX_ORDER).toContain("today");
    expect(BOX_ORDER).toContain("week");
    expect(BOX_ORDER).toContain("later");
  });
});

describe("BOX_FILTER_ALL", () => {
  it("should be 'all'", () => {
    expect(BOX_FILTER_ALL).toBe("all");
  });
});

describe("BOX_FILTER_LABELS", () => {
  it("should have a label for each box filter", () => {
    expect(BOX_FILTER_LABELS.all).toBeTruthy();
    expect(BOX_FILTER_LABELS.inbox).toBeTruthy();
    expect(BOX_FILTER_LABELS.today).toBeTruthy();
    expect(BOX_FILTER_LABELS.week).toBeTruthy();
    expect(BOX_FILTER_LABELS.later).toBeTruthy();
  });
});

describe("TASK_BOX_FILTER_ORDER", () => {
  it("should be an array with 4 elements", () => {
    expect(TASK_BOX_FILTER_ORDER).toHaveLength(4);
  });

  it("should contain 'all' filter", () => {
    expect(TASK_BOX_FILTER_ORDER).toContain("all");
  });

  it("should start with 'today'", () => {
    expect(TASK_BOX_FILTER_ORDER[0]).toBe("today");
  });

  it("should have 'week' as second element", () => {
    expect(TASK_BOX_FILTER_ORDER[1]).toBe("week");
  });

  it("should have 'later' as third element", () => {
    expect(TASK_BOX_FILTER_ORDER[2]).toBe("later");
  });

  it("should end with 'all'", () => {
    expect(TASK_BOX_FILTER_ORDER[3]).toBe("all");
  });
});

describe("DEFAULT_ACCENT_COLOR", () => {
  it("should be 'green'", () => {
    expect(DEFAULT_ACCENT_COLOR).toBe("green");
  });

  it("should be included in ACCENT_COLORS list", () => {
    expect(ACCENT_COLORS).toContain(DEFAULT_ACCENT_COLOR);
  });
});

describe("ACCENT_COLORS", () => {
  it("should have 8 colors", () => {
    expect(ACCENT_COLORS).toHaveLength(8);
  });

  it("should contain standard accent colors", () => {
    expect(ACCENT_COLORS).toContain("coral");
    expect(ACCENT_COLORS).toContain("orange");
    expect(ACCENT_COLORS).toContain("yellow");
    expect(ACCENT_COLORS).toContain("green");
    expect(ACCENT_COLORS).toContain("teal");
    expect(ACCENT_COLORS).toContain("blue");
    expect(ACCENT_COLORS).toContain("indigo");
    expect(ACCENT_COLORS).toContain("purple");
  });
});

describe("ACCENT_COLOR_VALUES", () => {
  it("should have a hex value for each accent color", () => {
    for (const color of ACCENT_COLORS) {
      expect(ACCENT_COLOR_VALUES[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("should have the correct value for green", () => {
    expect(ACCENT_COLOR_VALUES.green).toBe("#69b23e");
  });
});

describe("API_ACTIONS", () => {
  it("should define PING as 'ping'", () => {
    expect(API_ACTIONS.PING).toBe("ping");
  });

  it("should define INIT as 'init'", () => {
    expect(API_ACTIONS.INIT).toBe("init");
  });

  it("should define PULL as 'pull'", () => {
    expect(API_ACTIONS.PULL).toBe("pull");
  });

  it("should define PUSH as 'push'", () => {
    expect(API_ACTIONS.PUSH).toBe("push");
  });

  it("should have non-empty string values", () => {
    for (const value of Object.values(API_ACTIONS)) {
      expect(value).toBeTruthy();
    }
  });
});

describe("SYNC_INTERVAL_MS", () => {
  it("should be 5 minutes in milliseconds", () => {
    expect(SYNC_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  it("should be a positive number", () => {
    expect(SYNC_INTERVAL_MS).toBeGreaterThan(0);
  });
});

describe("SYNC_DEBOUNCE_MS", () => {
  it("should be 7500 milliseconds", () => {
    expect(SYNC_DEBOUNCE_MS).toBe(7500);
  });

  it("should be a positive number", () => {
    expect(SYNC_DEBOUNCE_MS).toBeGreaterThan(0);
  });
});

describe("DB_NAME", () => {
  it("should be 'clear-progress'", () => {
    expect(DB_NAME).toBe("clear-progress");
  });
});

describe("DB_VERSION", () => {
  it("should be 3", () => {
    expect(DB_VERSION).toBe(3);
  });
});

describe("STORAGE_KEYS", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  it("should define GAS_URL key", () => {
    expect(STORAGE_KEYS.GAS_URL).toBe("gas_url");
  });

  it("should define LAST_SYNC key", () => {
    expect(STORAGE_KEYS.LAST_SYNC).toBe("last_sync");
  });

  it("should define ACCENT_COLOR key", () => {
    expect(STORAGE_KEYS.ACCENT_COLOR).toBe("accent_color");
  });

  it("should define DEFAULT_BOX key", () => {
    expect(STORAGE_KEYS.DEFAULT_BOX).toBe("default_box");
  });
});

describe("SETTING_KEYS", () => {
  it("should define DEFAULT_BOX key", () => {
    expect(SETTING_KEYS.DEFAULT_BOX).toBe("default_box");
  });

  it("should define ACCENT_COLOR key", () => {
    expect(SETTING_KEYS.ACCENT_COLOR).toBe("accent_color");
  });
});

describe("MAX_COVER_SIZE_BYTES", () => {
  it("should be 2MB in bytes", () => {
    expect(MAX_COVER_SIZE_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe("PUSH_RESULT_STATUS", () => {
  it("should define CREATED status", () => {
    expect(PUSH_RESULT_STATUS.CREATED).toBe("created");
  });

  it("should define ACCEPTED status", () => {
    expect(PUSH_RESULT_STATUS.ACCEPTED).toBe("accepted");
  });

  it("should define CONFLICT status", () => {
    expect(PUSH_RESULT_STATUS.CONFLICT).toBe("conflict");
  });

  it("should define REJECTED status", () => {
    expect(PUSH_RESULT_STATUS.REJECTED).toBe("rejected");
  });
});

describe("REPEAT_RULE_TYPE", () => {
  it("should define DAILY as 'daily'", () => {
    expect(REPEAT_RULE_TYPE.DAILY).toBe("daily");
  });

  it("should define WEEKDAYS as 'weekdays'", () => {
    expect(REPEAT_RULE_TYPE.WEEKDAYS).toBe("weekdays");
  });

  it("should define WEEKLY as 'weekly'", () => {
    expect(REPEAT_RULE_TYPE.WEEKLY).toBe("weekly");
  });

  it("should define MONTHLY as 'monthly'", () => {
    expect(REPEAT_RULE_TYPE.MONTHLY).toBe("monthly");
  });

  it("should define INTERVAL as 'interval'", () => {
    expect(REPEAT_RULE_TYPE.INTERVAL).toBe("interval");
  });
});

describe("DEFAULT_PANEL_SIDE", () => {
  it("should be 'right'", () => {
    expect(DEFAULT_PANEL_SIDE).toBe("right");
  });
});

describe("PANEL_SIDES", () => {
  it("should contain both 'left' and 'right'", () => {
    expect(PANEL_SIDES).toContain("left");
    expect(PANEL_SIDES).toContain("right");
  });

  it("should have exactly 2 sides", () => {
    expect(PANEL_SIDES).toHaveLength(2);
  });
});
