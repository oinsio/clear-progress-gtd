import { describe, it, expect } from "vitest";
import i18n from "i18next";
import { parseRepeatRule, serializeRepeatRule, formatRepeatRuleLabel } from "./repeatRule";

describe("parseRepeatRule", () => {
  it("should return null for empty string", () => {
    expect(parseRepeatRule("")).toBeNull();
  });

  it("should parse a valid daily repeat rule", () => {
    expect(parseRepeatRule('{"type":"daily"}')).toEqual({ type: "daily" });
  });

  it("should parse a weekly rule with days", () => {
    expect(parseRepeatRule('{"type":"weekly","days":[1,3,5]}')).toEqual({
      type: "weekly",
      days: [1, 3, 5],
    });
  });

  it("should parse an interval rule", () => {
    expect(parseRepeatRule('{"type":"interval","interval":3}')).toEqual({
      type: "interval",
      interval: 3,
    });
  });

  it("should return null for invalid JSON", () => {
    expect(parseRepeatRule("invalid json")).toBeNull();
  });
});

describe("serializeRepeatRule", () => {
  it("should serialize a daily rule to JSON string", () => {
    expect(serializeRepeatRule({ type: "daily" })).toBe('{"type":"daily"}');
  });

  it("should serialize a weekly rule with days", () => {
    expect(serializeRepeatRule({ type: "weekly", days: [1, 3, 5] })).toBe(
      '{"type":"weekly","days":[1,3,5]}',
    );
  });

  it("should serialize an interval rule", () => {
    expect(serializeRepeatRule({ type: "interval", interval: 7 })).toBe(
      '{"type":"interval","interval":7}',
    );
  });
});

describe("formatRepeatRuleLabel", () => {
  const t = i18n.t.bind(i18n);

  it("should format daily rule", () => {
    expect(formatRepeatRuleLabel({ type: "daily" }, t)).toBe("Каждый день");
  });

  it("should format weekdays rule", () => {
    expect(formatRepeatRuleLabel({ type: "weekdays" }, t)).toBe("По будням");
  });

  it("should format weekly rule with specific days", () => {
    expect(formatRepeatRuleLabel({ type: "weekly", days: [1, 3, 5] }, t)).toBe("По Пн, Ср, Пт");
  });

  it("should format weekly rule with no days using generic label", () => {
    expect(formatRepeatRuleLabel({ type: "weekly" }, t)).toBe("По дням недели");
  });

  it("should format monthly rule", () => {
    expect(formatRepeatRuleLabel({ type: "monthly" }, t)).toBe("Каждый месяц");
  });

  it("should format interval rule with count", () => {
    expect(formatRepeatRuleLabel({ type: "interval", interval: 3 }, t)).toBe("Каждые 3 дня");
  });

  it("should format interval rule defaults to 1 when interval is missing", () => {
    expect(formatRepeatRuleLabel({ type: "interval" }, t)).toBe("Каждый 1 день");
  });
});
