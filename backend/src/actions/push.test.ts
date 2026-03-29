import { describe, it, expect, vi, beforeEach } from 'vitest';
import { push } from './push';
import { ERROR_CODES } from '../helpers/response';
import { PUSH_STATUSES } from '../helpers/constants';
import type { Task, Goal, Context, Category, ChecklistItem, Setting } from '../types';

vi.mock('../sheets/tasks.sheet', () => ({ getAllTasks: vi.fn(), upsertTasks: vi.fn() }));
vi.mock('../sheets/goals.sheet', () => ({ getAllGoals: vi.fn(), upsertGoals: vi.fn() }));
vi.mock('../sheets/contexts.sheet', () => ({ getAllContexts: vi.fn(), upsertContexts: vi.fn() }));
vi.mock('../sheets/categories.sheet', () => ({ getAllCategories: vi.fn(), upsertCategories: vi.fn() }));
vi.mock('../sheets/checklists.sheet', () => ({ getAllChecklistItems: vi.fn(), upsertChecklistItems: vi.fn() }));
vi.mock('../sheets/settings.sheet', () => ({ upsertSettings: vi.fn(), getAllSettings: vi.fn() }));

import { getAllTasks, upsertTasks } from '../sheets/tasks.sheet';
import { getAllGoals, upsertGoals } from '../sheets/goals.sheet';
import { getAllContexts, upsertContexts } from '../sheets/contexts.sheet';
import { getAllCategories, upsertCategories } from '../sheets/categories.sheet';
import { getAllChecklistItems, upsertChecklistItems } from '../sheets/checklists.sheet';
import { upsertSettings, getAllSettings } from '../sheets/settings.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '11111111-1111-4111-a111-111111111111',
    title: 'Test task',
    notes: '',
    box: 'inbox',
    goal_id: '',
    context_id: '',
    category_id: '',
    is_completed: false,
    completed_at: '',
    repeat_rule: '',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: '22222222-2222-4222-a222-222222222222',
    title: 'Test goal',
    description: '',
    cover_file_id: '',
    status: 'planning',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    id: '33333333-3333-4333-a333-333333333333',
    name: '@Home',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'Work',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeChecklistItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: '55555555-5555-4555-a555-555555555555',
    task_id: '11111111-1111-4111-a111-111111111111',
    title: 'Subtask',
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

describe('push', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllTasks).mockReturnValue([]);
    vi.mocked(getAllGoals).mockReturnValue([]);
    vi.mocked(getAllContexts).mockReturnValue([]);
    vi.mocked(getAllCategories).mockReturnValue([]);
    vi.mocked(getAllChecklistItems).mockReturnValue([]);
    vi.mocked(getAllSettings).mockReturnValue([]);
  });

  describe('general response', () => {
    it('should return ok: true when changes is empty', () => {
      push({});
      expect(parseResponse().ok).toBe(true);
    });

    it('should return results object in response', () => {
      push({});
      expect(parseResponse()).toHaveProperty('results');
    });

    it('should return server_time as ISO string', () => {
      push({});
      const serverTime = parseResponse().server_time as string;
      expect(serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should not include entity key in results when array is not provided', () => {
      push({});
      const results = parseResponse().results as Record<string, unknown>;
      expect(results).not.toHaveProperty('tasks');
      expect(results).not.toHaveProperty('goals');
    });

    it('should not call getAllTasks when tasks array is not provided', () => {
      push({});
      expect(getAllTasks).not.toHaveBeenCalled();
    });

    it('should not call getAllTasks when tasks array is empty', () => {
      push({ tasks: [] });
      expect(getAllTasks).not.toHaveBeenCalled();
    });
  });

  describe('new record (not on server)', () => {
    it('should return status: created for a new task', () => {
      const newTask = makeTask({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', status: PUSH_STATUSES.CREATED });
    });

    it('should call upsertTask for a new task', () => {
      const newTask = makeTask({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      expect(upsertTasks).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' })]));

    });

    it('should return the client version for a created record', () => {
      const newTask = makeTask({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ version: 3 });
    });
  });

  describe('accepted record (client newer than server)', () => {
    it('should return status: accepted when client updated_at is newer', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 2 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: '11111111-1111-4111-a111-111111111111', status: PUSH_STATUSES.ACCEPTED });
    });

    it('should save task with incremented server version', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 5 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      expect(upsertTasks).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ version: 6 })]));

    });

    it('should return new version (serverVersion + 1) in accepted result', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 5 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ version: 6 });
    });

    it('should treat equal updated_at as accepted (last-write-wins, client >= server)', () => {
      const sameTime = '2025-01-01T12:00:00.000Z';
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: sameTime, version: 2 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: sameTime, version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: PUSH_STATUSES.ACCEPTED });
    });
  });

  describe('conflict (server newer than client)', () => {
    it('should return status: conflict when server updated_at is newer', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: '11111111-1111-4111-a111-111111111111', status: PUSH_STATUSES.CONFLICT });
    });

    it('should not upsert any task on conflict', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it('should return server_record in conflict result', () => {
      const serverTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: '11111111-1111-4111-a111-111111111111', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ server_record: serverTask });
    });
  });

  describe('find correct server record by id', () => {
    it('should use the matching server record version when multiple records exist', () => {
      const serverTask1 = makeTask({ id: '11111111-1111-4111-a111-111111111111', version: 5, updated_at: '2025-01-01T00:00:00.000Z' });
      const serverTask2 = makeTask({ id: '22222222-2222-4222-a222-222222222222', version: 10, updated_at: '2025-01-01T00:00:00.000Z' });
      vi.mocked(getAllTasks).mockReturnValue([serverTask1, serverTask2]);

      const clientTask = makeTask({ id: '22222222-2222-4222-a222-222222222222', updated_at: '2025-06-01T00:00:00.000Z' });
      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      // serverTask2.version (10) + 1 = 11; if find() matched serverTask1, version would be 6
      expect(results.tasks[0]).toMatchObject({ version: 11 });
    });
  });

  describe('multiple records in one push', () => {
    it('should return results for all records in the array', () => {
      const newTask = makeTask({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' });
      const serverTask = makeTask({ id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb', updated_at: '2025-01-01T00:00:00.000Z', version: 2 });
      const clientExisting = makeTask({ id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb', updated_at: '2025-01-02T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [newTask, clientExisting] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
    });
  });

  describe('other entity types', () => {
    it('should process goals and return results', () => {
      const newGoal = makeGoal({ id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [newGoal] });

      expect(upsertGoals).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee' })]));

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.goals[0]).toMatchObject({ id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee', status: PUSH_STATUSES.CREATED });
    });

    it('should process contexts and return results', () => {
      const newContext = makeContext({ id: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [newContext] });

      expect(upsertContexts).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1' })]));

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.contexts[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });

    it('should process categories and return results', () => {
      const newCategory = makeCategory({ id: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [newCategory] });

      expect(upsertCategories).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3' })]));

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.categories[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });

    it('should process checklist_items and return results', () => {
      const newItem = makeChecklistItem({ id: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [newItem] });

      expect(upsertChecklistItems).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5' })]));

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.checklist_items[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });
  });

  describe('settings', () => {
    it('should call upsertSettings once with all accepted settings', () => {
      const settings: Setting[] = [
        { key: 'default_box', value: 'today', updated_at: '2025-01-01T00:00:00.000Z' },
        { key: 'accent_color', value: 'purple', updated_at: '2025-01-01T00:00:00.000Z' },
      ];

      push({ settings });

      expect(upsertSettings).toHaveBeenCalledTimes(1);
      expect(upsertSettings).toHaveBeenCalledWith(settings);
    });

    it('should return accepted status for each setting using key as id', () => {
      const settings: Setting[] = [
        { key: 'default_box', value: 'today', updated_at: '2025-01-01T00:00:00.000Z' },
      ];

      push({ settings });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.settings[0]).toMatchObject({ id: 'default_box', status: PUSH_STATUSES.ACCEPTED });
    });

    it('should not call upsertSettings when settings array is empty', () => {
      push({ settings: [] });
      expect(upsertSettings).not.toHaveBeenCalled();
    });

    it('should upsert setting when server does not have it yet', () => {
      const clientSetting: Setting = { key: 'default_box', value: 'today', updated_at: '2026-03-21T10:00:00.000Z' };
      vi.mocked(getAllSettings).mockReturnValue([]);

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([clientSetting]);
    });

    it('should upsert setting when client updated_at is newer than server', () => {
      const clientSetting: Setting = { key: 'default_box', value: 'today', updated_at: '2026-03-21T12:00:00.000Z' };
      vi.mocked(getAllSettings).mockReturnValue([
        { key: 'default_box', value: 'inbox', updated_at: '2026-03-21T10:00:00.000Z' },
      ]);

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([clientSetting]);
    });

    it('should return accepted when client updated_at is newer than server', () => {
      const clientSetting: Setting = { key: 'default_box', value: 'today', updated_at: '2026-03-21T12:00:00.000Z' };
      vi.mocked(getAllSettings).mockReturnValue([
        { key: 'default_box', value: 'inbox', updated_at: '2026-03-21T10:00:00.000Z' },
      ]);

      push({ settings: [clientSetting] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.settings[0]).toMatchObject({ id: 'default_box', status: PUSH_STATUSES.ACCEPTED });
    });

    it('should not upsert any setting when server updated_at is newer than client', () => {
      const clientSetting: Setting = { key: 'default_box', value: 'today', updated_at: '2026-03-21T10:00:00.000Z' };
      vi.mocked(getAllSettings).mockReturnValue([
        { key: 'default_box', value: 'week', updated_at: '2026-03-21T12:00:00.000Z' },
      ]);

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([]);
    });

    it('should return conflict when server updated_at is newer than client', () => {
      const clientSetting: Setting = { key: 'default_box', value: 'today', updated_at: '2026-03-21T10:00:00.000Z' };
      vi.mocked(getAllSettings).mockReturnValue([
        { key: 'default_box', value: 'week', updated_at: '2026-03-21T12:00:00.000Z' },
      ]);

      push({ settings: [clientSetting] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.settings[0]).toMatchObject({ id: 'default_box', status: PUSH_STATUSES.CONFLICT });
    });

    it('should match setting by key not by position when multiple server settings exist', () => {
      // default_box has newer server time; accent_color has older server time
      vi.mocked(getAllSettings).mockReturnValue([
        { key: 'default_box', value: 'inbox', updated_at: '2025-01-02T00:00:00.000Z' },
        { key: 'accent_color', value: 'green', updated_at: '2024-01-01T00:00:00.000Z' },
      ]);

      // Pushing accent_color with updated_at newer than accent_color server time → should be ACCEPTED
      const clientSetting: Setting = { key: 'accent_color', value: 'purple', updated_at: '2025-01-01T00:00:00.000Z' };
      push({ settings: [clientSetting] });

      const results = parseResponse().results as Record<string, unknown[]>;
      // If find() incorrectly matched default_box (first), client (2025-01-01) < server (2025-01-02) → CONFLICT
      expect(results.settings[0]).toMatchObject({ id: 'accent_color', status: PUSH_STATUSES.ACCEPTED });
    });
  });

  describe('rejected record (blank title/name)', () => {
    it('should return status: rejected for task with empty title', () => {
      const blankTask = makeTask({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', status: 'rejected' });
    });

    it('should not upsert any task when task title is empty', () => {
      const blankTask = makeTask({ title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for task with whitespace-only title', () => {
      const blankTask = makeTask({ id: 'dddddddd-dddd-4ddd-addd-dddddddddddd', title: '   ' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'dddddddd-dddd-4ddd-addd-dddddddddddd', status: 'rejected' });
    });

    it('should return status: rejected for goal with empty title', () => {
      const blankGoal = makeGoal({ id: 'ffffffff-ffff-4fff-afff-ffffffffffff', title: '' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [blankGoal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.goals[0]).toMatchObject({ id: 'ffffffff-ffff-4fff-afff-ffffffffffff', status: 'rejected' });
    });

    it('should not upsert any goal when goal title is empty', () => {
      const blankGoal = makeGoal({ title: '' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [blankGoal] });

      expect(upsertGoals).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for context with empty name', () => {
      const blankContext = makeContext({ id: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', name: '' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [blankContext] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.contexts[0]).toMatchObject({ id: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', status: 'rejected' });
    });

    it('should not upsert any context when context name is empty', () => {
      const blankContext = makeContext({ name: '' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [blankContext] });

      expect(upsertContexts).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for category with empty name', () => {
      const blankCategory = makeCategory({ id: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', name: '' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [blankCategory] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.categories[0]).toMatchObject({ id: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', status: 'rejected' });
    });

    it('should not upsert any category when category name is empty', () => {
      const blankCategory = makeCategory({ name: '' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [blankCategory] });

      expect(upsertCategories).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for checklist_item with empty title', () => {
      const blankItem = makeChecklistItem({ id: 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', title: '' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [blankItem] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.checklist_items[0]).toMatchObject({ id: 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', status: 'rejected' });
    });

    it('should not upsert any checklist item when checklist item title is empty', () => {
      const blankItem = makeChecklistItem({ title: '' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [blankItem] });

      expect(upsertChecklistItems).toHaveBeenCalledWith([]);
    });

    it('should include reason field in rejected result', () => {
      const blankTask = makeTask({ title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toHaveProperty('reason');
    });

    it('should process valid records alongside rejected ones in same array', () => {
      const validTask = makeTask({ id: 'a7b8c9d0-e1f2-4345-89ab-cdef01234567', title: 'Valid task' });
      const blankTask = makeTask({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [validTask, blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
      expect(results.tasks[0]).toMatchObject({ id: 'a7b8c9d0-e1f2-4345-89ab-cdef01234567', status: 'created' });
      expect(results.tasks[1]).toMatchObject({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', status: 'rejected' });
    });

    it('should handle rejected task and created goal in same push', () => {
      const blankTask = makeTask({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', title: '' });
      const validGoal = makeGoal({ id: 'f7a8b9c0-d1e2-4f34-9a5b-6c7d8e9f0a1b', title: 'Valid goal' });
      vi.mocked(getAllTasks).mockReturnValue([]);
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ tasks: [blankTask], goals: [validGoal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', status: 'rejected' });
      expect(results.goals[0]).toMatchObject({ id: 'f7a8b9c0-d1e2-4f34-9a5b-6c7d8e9f0a1b', status: 'created' });
    });
  });

  describe('rejected record (invalid box)', () => {
    it.each(['', 'INBOX', 'tomorrow', 'someday', 'bad-box'])(
      'should return status: rejected for task with box="%s"',
      (invalidBox) => {
        const task = makeTask({ box: invalidBox as Task['box'] });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
      },
    );

    it('should not upsert any task when task has invalid box', () => {
      const task = makeTask({ box: 'invalid' as Task['box'] });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it('should include reason field when box is invalid', () => {
      const task = makeTask({ box: 'someday' as Task['box'] });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toHaveProperty('reason');
    });

    it.each(['inbox', 'today', 'week', 'later'] as Task['box'][])(
      'should NOT reject task with valid box="%s"',
      (validBox) => {
        const task = makeTask({ box: validBox });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: 'created' });
      },
    );

    it('should process valid task alongside rejected one with invalid box', () => {
      const validTask = makeTask({ id: 'a7b8c9d0-e1f2-4345-89ab-cdef01234567', box: 'today' });
      const invalidBoxTask = makeTask({ id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', box: 'invalid' as Task['box'] });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [validTask, invalidBoxTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
      expect(results.tasks[0]).toMatchObject({ status: 'created' });
      expect(results.tasks[1]).toMatchObject({ status: 'rejected' });
    });
  });

  describe('rejected record (invalid foreign key)', () => {
    const VALID_FK_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    describe('Task optional FKs (goal_id, context_id, category_id)', () => {
      it('should return status: rejected for task with invalid goal_id', () => {
        const task = makeTask({ goal_id: 'not-a-uuid' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
      });

      it('should not upsert any task when task has invalid goal_id', () => {
        const task = makeTask({ goal_id: 'not-a-uuid' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        expect(upsertTasks).toHaveBeenCalledWith([]);
      });

      it('should return status: rejected for task with invalid context_id', () => {
        const task = makeTask({ context_id: '!!!' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
      });

      it('should return status: rejected for task with invalid category_id', () => {
        const task = makeTask({ category_id: 'bad-id' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
      });

      it('should NOT reject task when goal_id is empty string', () => {
        const task = makeTask({ goal_id: '' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
      });

      it('should NOT reject task when goal_id is a valid UUID', () => {
        const task = makeTask({ goal_id: VALID_FK_UUID });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
      });

      it('should include reason field in rejected result for invalid FK', () => {
        const task = makeTask({ goal_id: 'not-a-uuid' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [task] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks[0]).toHaveProperty('reason');
      });
    });

    describe('ChecklistItem required task_id', () => {
      it('should return status: rejected for checklist_item with empty task_id', () => {
        const item = makeChecklistItem({ task_id: '' });
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ checklist_items: [item] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.checklist_items[0]).toMatchObject({ status: 'rejected' });
      });

      it('should not upsert any checklist item when task_id is empty', () => {
        const item = makeChecklistItem({ task_id: '' });
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ checklist_items: [item] });

        expect(upsertChecklistItems).toHaveBeenCalledWith([]);
      });

      it('should return status: rejected for checklist_item with invalid task_id format', () => {
        const item = makeChecklistItem({ task_id: 'not-a-uuid' });
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ checklist_items: [item] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.checklist_items[0]).toMatchObject({ status: 'rejected' });
      });

      it('should NOT reject checklist_item when task_id is a valid UUID', () => {
        const item = makeChecklistItem({ task_id: VALID_FK_UUID });
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ checklist_items: [item] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.checklist_items[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
      });

      it('should include reason field in rejected result for missing task_id', () => {
        const item = makeChecklistItem({ task_id: '' });
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ checklist_items: [item] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.checklist_items[0]).toHaveProperty('reason');
      });

      it('should use a different reason for missing required FK vs invalid optional FK', () => {
        const taskWithBadGoal = makeTask({ goal_id: 'bad' });
        const itemWithNoTaskId = makeChecklistItem({ task_id: '' });
        vi.mocked(getAllTasks).mockReturnValue([]);
        vi.mocked(getAllChecklistItems).mockReturnValue([]);

        push({ tasks: [taskWithBadGoal], checklist_items: [itemWithNoTaskId] });

        const results = parseResponse().results as Record<string, unknown[]>;
        const taskReason = (results.tasks[0] as Record<string, unknown>).reason;
        const itemReason = (results.checklist_items[0] as Record<string, unknown>).reason;
        expect(taskReason).not.toBe(itemReason);
      });
    });

    describe('mixed batch with FK errors', () => {
      it('should process valid task alongside task with invalid FK in same array', () => {
        const validTask = makeTask({ id: 'a7b8c9d0-e1f2-4345-89ab-cdef01234567' });
        const invalidTask = makeTask({ goal_id: 'bad-fk' });
        vi.mocked(getAllTasks).mockReturnValue([]);

        push({ tasks: [validTask, invalidTask] });

        const results = parseResponse().results as Record<string, unknown[]>;
        expect(results.tasks).toHaveLength(2);
        expect(results.tasks[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
        expect(results.tasks[1]).toMatchObject({ status: 'rejected' });
      });
    });
  });

  describe('rejected record (invalid id)', () => {
    it('should return status: rejected for task with empty id', () => {
      const task = makeTask({ id: '', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
    });

    it('should not upsert any task when task id is empty', () => {
      const task = makeTask({ id: '', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for task with unreadable id', () => {
      const task = makeTask({ id: '!!!###$$$', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
    });

    it('should return status: rejected for task with wrong-format id', () => {
      const task = makeTask({ id: 'not-a-uuid', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
    });

    it('should return status: rejected for goal with invalid id', () => {
      const goal = makeGoal({ id: '', title: 'Valid title' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [goal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.goals[0]).toMatchObject({ status: 'rejected' });
    });

    it('should not upsert any goal when goal id is invalid', () => {
      const goal = makeGoal({ id: 'bad-id', title: 'Valid title' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [goal] });

      expect(upsertGoals).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for context with invalid id', () => {
      const context = makeContext({ id: '', name: 'Valid name' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [context] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.contexts[0]).toMatchObject({ status: 'rejected' });
    });

    it('should not upsert any context when context id is invalid', () => {
      const context = makeContext({ id: '!!!', name: 'Valid name' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [context] });

      expect(upsertContexts).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for category with invalid id', () => {
      const category = makeCategory({ id: 'not-a-uuid', name: 'Valid name' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [category] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.categories[0]).toMatchObject({ status: 'rejected' });
    });

    it('should not upsert any category when category id is invalid', () => {
      const category = makeCategory({ id: '', name: 'Valid name' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [category] });

      expect(upsertCategories).toHaveBeenCalledWith([]);
    });

    it('should return status: rejected for checklist_item with invalid id', () => {
      const item = makeChecklistItem({ id: '', title: 'Valid title' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [item] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.checklist_items[0]).toMatchObject({ status: 'rejected' });
    });

    it('should not upsert any checklist item when checklist item id is invalid', () => {
      const item = makeChecklistItem({ id: 'bad-id', title: 'Valid title' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [item] });

      expect(upsertChecklistItems).toHaveBeenCalledWith([]);
    });

    it('should include reason field in rejected result', () => {
      const task = makeTask({ id: '', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [task] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toHaveProperty('reason');
    });

    it('should process valid records alongside invalid-id records in same array', () => {
      const validTask = makeTask({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', title: 'Valid task' });
      const invalidTask = makeTask({ id: 'bad-id', title: 'Valid title' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [validTask, invalidTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
      expect(results.tasks[0]).toMatchObject({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'created' });
      expect(results.tasks[1]).toMatchObject({ status: 'rejected' });
    });

    it('should handle invalid-id task and created goal in same push', () => {
      const invalidTask = makeTask({ id: '', title: 'Valid title' });
      const validGoal = makeGoal({ id: 'e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b', title: 'Valid goal' });
      vi.mocked(getAllTasks).mockReturnValue([]);
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ tasks: [invalidTask], goals: [validGoal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: 'rejected' });
      expect(results.goals[0]).toMatchObject({ id: 'e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b', status: 'created' });
    });
  });

  describe('error handling', () => {
    it('should return NOT_INITIALIZED error when sheet throws with NOT_INITIALIZED message', () => {
      vi.mocked(getAllTasks).mockImplementation(() => {
        throw new Error(ERROR_CODES.NOT_INITIALIZED);
      });

      push({ tasks: [makeTask()] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
    });

    it('should return INTERNAL_ERROR when sheet throws an unexpected error', () => {
      vi.mocked(getAllGoals).mockImplementation(() => {
        throw new Error('Spreadsheet not accessible');
      });

      push({ goals: [makeGoal()] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should include the original error message in INTERNAL_ERROR response', () => {
      const originalMessage = 'Unexpected sheet error';
      vi.mocked(getAllContexts).mockImplementation(() => {
        throw new Error(originalMessage);
      });

      push({ contexts: [makeContext()] });

      expect(parseResponse().message).toBe(originalMessage);
    });
  });
});