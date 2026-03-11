import { describe, it, expect } from 'vitest';
import { resolveConflict } from './conflict';
import { CONFLICT_RESOLUTION } from './constants';

describe('resolveConflict', () => {
  it('should return accept when client updated_at is newer than server', () => {
    expect(resolveConflict('2025-01-02T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(CONFLICT_RESOLUTION.ACCEPT);
  });

  it('should return conflict when server updated_at is newer than client', () => {
    expect(resolveConflict('2025-01-01T00:00:00.000Z', '2025-01-02T00:00:00.000Z')).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it('should return accept when client and server updated_at are equal', () => {
    const sameTime = '2025-06-15T12:00:00.000Z';
    expect(resolveConflict(sameTime, sameTime)).toBe(CONFLICT_RESOLUTION.ACCEPT);
  });

  it('should compare by milliseconds precision', () => {
    expect(resolveConflict('2025-01-01T00:00:00.001Z', '2025-01-01T00:00:00.000Z')).toBe(CONFLICT_RESOLUTION.ACCEPT);
    expect(resolveConflict('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.001Z')).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it('should compare by time of day within the same date', () => {
    expect(resolveConflict('2025-01-01T12:00:00.000Z', '2025-01-01T11:59:59.999Z')).toBe(CONFLICT_RESOLUTION.ACCEPT);
    expect(resolveConflict('2025-01-01T11:59:59.999Z', '2025-01-01T12:00:00.000Z')).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });
});