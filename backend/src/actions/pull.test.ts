import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pull } from './pull';
import { ERROR_CODES } from '../helpers/response';

vi.mock('../sheets/tasks.sheet', () => ({ getTasksByVersion: vi.fn() }));
vi.mock('../sheets/goals.sheet', () => ({ getGoalsByVersion: vi.fn() }));
vi.mock('../sheets/contexts.sheet', () => ({ getContextsByVersion: vi.fn() }));
vi.mock('../sheets/categories.sheet', () => ({ getCategoriesByVersion: vi.fn() }));
vi.mock('../sheets/checklists.sheet', () => ({ getChecklistItemsByVersion: vi.fn() }));
vi.mock('../sheets/settings.sheet', () => ({ getAllSettings: vi.fn() }));

import { getTasksByVersion } from '../sheets/tasks.sheet';
import { getGoalsByVersion } from '../sheets/goals.sheet';
import { getContextsByVersion } from '../sheets/contexts.sheet';
import { getCategoriesByVersion } from '../sheets/categories.sheet';
import { getChecklistItemsByVersion } from '../sheets/checklists.sheet';
import { getAllSettings } from '../sheets/settings.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

const defaultVersions = { tasks: 0, goals: 0, contexts: 0, categories: 0, checklist_items: 0 };

describe('pull', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTasksByVersion).mockReturnValue([]);
    vi.mocked(getGoalsByVersion).mockReturnValue([]);
    vi.mocked(getContextsByVersion).mockReturnValue([]);
    vi.mocked(getCategoriesByVersion).mockReturnValue([]);
    vi.mocked(getChecklistItemsByVersion).mockReturnValue([]);
    vi.mocked(getAllSettings).mockReturnValue([]);
  });

  it('should return ok: true on success', () => {
    pull(defaultVersions);
    expect(parseResponse().ok).toBe(true);
  });

  it('should return data with all five entity arrays', () => {
    pull(defaultVersions);
    const response = parseResponse();
    const data = response.data as Record<string, unknown>;
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('goals');
    expect(data).toHaveProperty('contexts');
    expect(data).toHaveProperty('categories');
    expect(data).toHaveProperty('checklist_items');
  });

  it('should return settings array in response', () => {
    pull(defaultVersions);
    expect(parseResponse()).toHaveProperty('settings');
  });

  it('should return server_time as ISO string', () => {
    pull(defaultVersions);
    const serverTime = parseResponse().server_time as string;
    expect(() => new Date(serverTime).toISOString()).not.toThrow();
    expect(serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should pass tasks version to getTasksByVersion', () => {
    pull({ ...defaultVersions, tasks: 42 });
    expect(getTasksByVersion).toHaveBeenCalledWith(42);
  });

  it('should pass goals version to getGoalsByVersion', () => {
    pull({ ...defaultVersions, goals: 10 });
    expect(getGoalsByVersion).toHaveBeenCalledWith(10);
  });

  it('should pass contexts version to getContextsByVersion', () => {
    pull({ ...defaultVersions, contexts: 5 });
    expect(getContextsByVersion).toHaveBeenCalledWith(5);
  });

  it('should pass categories version to getCategoriesByVersion', () => {
    pull({ ...defaultVersions, categories: 3 });
    expect(getCategoriesByVersion).toHaveBeenCalledWith(3);
  });

  it('should pass checklist_items version to getChecklistItemsByVersion', () => {
    pull({ ...defaultVersions, checklist_items: 20 });
    expect(getChecklistItemsByVersion).toHaveBeenCalledWith(20);
  });

  it('should use 0 as default version when tasks key is undefined', () => {
    pull({ goals: 0, contexts: 0, categories: 0, checklist_items: 0 } as never);
    expect(getTasksByVersion).toHaveBeenCalledWith(0);
  });

  it('should return entity records returned by sheet functions', () => {
    const mockTask = { id: 'task-1', version: 5 } as never;
    vi.mocked(getTasksByVersion).mockReturnValue([mockTask]);

    pull(defaultVersions);

    const data = parseResponse().data as Record<string, unknown>;
    expect(data.tasks).toEqual([mockTask]);
  });

  it('should return settings returned by getAllSettings', () => {
    const mockSettings = [{ key: 'default_box', value: 'inbox', updated_at: '2025-01-01T00:00:00.000Z' }];
    vi.mocked(getAllSettings).mockReturnValue(mockSettings);

    pull(defaultVersions);

    expect(parseResponse().settings).toEqual(mockSettings);
  });

  it('should return NOT_INITIALIZED error when sheet throws with NOT_INITIALIZED message', () => {
    vi.mocked(getTasksByVersion).mockImplementation(() => {
      throw new Error(ERROR_CODES.NOT_INITIALIZED);
    });

    pull(defaultVersions);

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
  });

  it('should return INTERNAL_ERROR when sheet throws an unexpected error', () => {
    vi.mocked(getGoalsByVersion).mockImplementation(() => {
      throw new Error('Something went wrong');
    });

    pull(defaultVersions);

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('should include the original error message in INTERNAL_ERROR response', () => {
    const originalMessage = 'Unexpected sheet error';
    vi.mocked(getContextsByVersion).mockImplementation(() => {
      throw new Error(originalMessage);
    });

    pull(defaultVersions);

    expect(parseResponse().message).toBe(originalMessage);
  });
});