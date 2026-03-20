const GAS_URL_BASE = "https://script.google.com/macros/s/";
const GAS_URL_SUFFIX = "/exec";

export function parseGasInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${GAS_URL_BASE}${trimmed}${GAS_URL_SUFFIX}`;
}
