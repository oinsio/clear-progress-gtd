import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  API_VERSION,
  VALID_GOAL_STATUSES,
  MAX_COVER_SIZE_BYTES,
  DEFAULT_COVER_EXTENSION,
  colMap,
  SHEET_NAMES,
  coerceSheetGoalStatus,
  isValidUuid,
} from './constants';

describe('APP_NAME', () => {
  it('should be "clear_progress"', () => {
    expect(APP_NAME).toBe('clear_progress');
  });
});

describe('API_VERSION', () => {
  it('should be "1.0"', () => {
    expect(API_VERSION).toBe('1.0');
  });
});

describe('VALID_GOAL_STATUSES', () => {
  it('should include "planning" as the first value', () => {
    expect(VALID_GOAL_STATUSES[0]).toBe('planning');
  });

  it('should contain all five valid statuses', () => {
    expect(VALID_GOAL_STATUSES).toEqual(['planning', 'in_progress', 'paused', 'completed', 'cancelled']);
  });
});

describe('MAX_COVER_SIZE_BYTES', () => {
  it('should equal exactly 2 MB (2097152 bytes)', () => {
    expect(MAX_COVER_SIZE_BYTES).toBe(2097152);
  });
});

describe('DEFAULT_COVER_EXTENSION', () => {
  it('should be "jpg"', () => {
    expect(DEFAULT_COVER_EXTENSION).toBe('jpg');
  });
});

describe('colMap', () => {
  it('should map id column to index 0 for Tasks sheet', () => {
    expect(colMap(SHEET_NAMES.TASKS).id).toBe(0);
  });

  it('should map title column to index 1 for Tasks sheet', () => {
    expect(colMap(SHEET_NAMES.TASKS).title).toBe(1);
  });

  it('should map id column to index 0 for Goals sheet', () => {
    expect(colMap(SHEET_NAMES.GOALS).id).toBe(0);
  });

  it('should map version to the last column for Goals sheet', () => {
    const goalsMap = colMap(SHEET_NAMES.GOALS);
    expect(goalsMap.version).toBe(9);
  });
});

describe('coerceSheetGoalStatus', () => {
  it('should return "planning" for input "planning"', () => {
    expect(coerceSheetGoalStatus('planning')).toBe('planning');
  });
});

describe('isValidUuid', () => {
  const VALID_UUID = '11111111-1111-4111-a111-111111111111';

  it('should return false for a UUID with a leading prefix', () => {
    expect(isValidUuid(`prefix-${VALID_UUID}`)).toBe(false);
  });

  it('should return false for a UUID with a trailing suffix', () => {
    expect(isValidUuid(`${VALID_UUID}-suffix`)).toBe(false);
  });

  it('should return true for a valid UUID v4', () => {
    expect(isValidUuid(VALID_UUID)).toBe(true);
  });

  it('should return false for an empty string', () => {
    expect(isValidUuid('')).toBe(false);
  });
});
