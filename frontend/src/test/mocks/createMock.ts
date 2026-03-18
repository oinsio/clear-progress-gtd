export function createMock<T>(
  defaults: Partial<Record<keyof T, unknown>>,
  overrides: Partial<Record<keyof T, unknown>> = {},
): T {
  return { ...defaults, ...overrides } as unknown as T;
}
