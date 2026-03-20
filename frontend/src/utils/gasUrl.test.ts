import { describe, it, expect } from "vitest";
import { parseGasInput } from "./gasUrl";

const FULL_URL = "https://script.google.com/macros/s/AKfycbxABC123/exec";
const DEPLOYMENT_ID = "AKfycbxABC123";

describe("parseGasInput", () => {
  it("should return full URL as-is when input starts with https://", () => {
    expect(parseGasInput(FULL_URL)).toBe(FULL_URL);
  });

  it("should build full URL from deployment ID", () => {
    expect(parseGasInput(DEPLOYMENT_ID)).toBe(
      `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`,
    );
  });

  it("should trim whitespace before processing", () => {
    expect(parseGasInput(`  ${FULL_URL}  `)).toBe(FULL_URL);
  });

  it("should trim whitespace from deployment ID", () => {
    expect(parseGasInput(`  ${DEPLOYMENT_ID}  `)).toBe(
      `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`,
    );
  });

  it("should handle URL with trailing slash", () => {
    const urlWithSlash = `${FULL_URL}/`;
    expect(parseGasInput(urlWithSlash)).toBe(urlWithSlash);
  });
});
