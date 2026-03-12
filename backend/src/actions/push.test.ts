import { describe, it, expect, vi, beforeEach } from 'vitest';
import { push } from './push';
import { ERROR_CODES } from '../helpers/response';
import { PUSH_STATUSES } from '../helpers/constants';
import type { Task, Goal, Context, Category, ChecklistItem, Setting } from '../types';

vi.mock('../sheets/tasks.sheet', () => ({ getAllTasks: vi.fn(), upsertTask: vi.fn() }));
vi.mock('../sheets/goals.sheet', () => ({ getAllGoals: vi.fn(), upsertGoal: vi.fn() }));
vi.mock('../sheets/contexts.sheet', () => ({ getAllContexts: vi.fn(), upsertContext: vi.fn() }));
vi.mock('../sheets/categories.sheet', () => ({ getAllCategories: vi.fn(), upsertCategory: vi.fn() }));
vi.mock('../sheets/checklists.sheet', () => ({ getAllChecklistItems: vi.fn(), upsertChecklistItem: vi.fn() }));
vi.mock('../sheets/settings.sheet', () => ({ upsertSetting: vi.fn() }));

import { getAllTasks, upsertTask } from '../sheets/tasks.sheet';
import { getAllGoals, upsertGoal } from '../sheets/goals.sheet';
import { getAllContexts, upsertContext } from '../sheets/contexts.sheet';
import { getAllCategories, upsertCategory } from '../sheets/categories.sheet';
import { getAllChecklistItems, upsertChecklistItem } from '../sheets/checklists.sheet';
import { upsertSetting } from '../sheets/settings.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
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
    id: 'goal-1',
    title: 'Test goal',
    description: '',
    cover_file_id: '',
    status: 'not_started',
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
    id: 'context-1',
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
    id: 'category-1',
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
    id: 'item-1',
    task_id: 'task-1',
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
      const newTask = makeTask({ id: 'task-new', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-new', status: PUSH_STATUSES.CREATED });
    });

    it('should call upsertTask for a new task', () => {
      const newTask = makeTask({ id: 'task-new' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      expect(upsertTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-new' }));
    });

    it('should return the client version for a created record', () => {
      const newTask = makeTask({ id: 'task-new', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [newTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ version: 3 });
    });
  });

  describe('accepted record (client newer than server)', () => {
    it('should return status: accepted when client updated_at is newer', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 2 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-1', status: PUSH_STATUSES.ACCEPTED });
    });

    it('should save task with incremented server version', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 5 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      expect(upsertTask).toHaveBeenCalledWith(expect.objectContaining({ version: 6 }));
    });

    it('should return new version (serverVersion + 1) in accepted result', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 5 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ version: 6 });
    });

    it('should treat equal updated_at as accepted (last-write-wins, client >= server)', () => {
      const sameTime = '2025-01-01T12:00:00.000Z';
      const serverTask = makeTask({ id: 'task-1', updated_at: sameTime, version: 2 });
      const clientTask = makeTask({ id: 'task-1', updated_at: sameTime, version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ status: PUSH_STATUSES.ACCEPTED });
    });
  });

  describe('conflict (server newer than client)', () => {
    it('should return status: conflict when server updated_at is newer', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-1', status: PUSH_STATUSES.CONFLICT });
    });

    it('should not call upsertTask on conflict', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      expect(upsertTask).not.toHaveBeenCalled();
    });

    it('should return server_record in conflict result', () => {
      const serverTask = makeTask({ id: 'task-1', updated_at: '2025-01-02T00:00:00.000Z', version: 3 });
      const clientTask = makeTask({ id: 'task-1', updated_at: '2025-01-01T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ server_record: serverTask });
    });
  });

  describe('multiple records in one push', () => {
    it('should return results for all records in the array', () => {
      const newTask = makeTask({ id: 'task-new' });
      const serverTask = makeTask({ id: 'task-existing', updated_at: '2025-01-01T00:00:00.000Z', version: 2 });
      const clientExisting = makeTask({ id: 'task-existing', updated_at: '2025-01-02T00:00:00.000Z', version: 1 });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [newTask, clientExisting] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
    });
  });

  describe('other entity types', () => {
    it('should process goals and return results', () => {
      const newGoal = makeGoal({ id: 'goal-new' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [newGoal] });

      expect(upsertGoal).toHaveBeenCalledWith(expect.objectContaining({ id: 'goal-new' }));
      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.goals[0]).toMatchObject({ id: 'goal-new', status: PUSH_STATUSES.CREATED });
    });

    it('should process contexts and return results', () => {
      const newContext = makeContext({ id: 'context-new' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [newContext] });

      expect(upsertContext).toHaveBeenCalledWith(expect.objectContaining({ id: 'context-new' }));
      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.contexts[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });

    it('should process categories and return results', () => {
      const newCategory = makeCategory({ id: 'category-new' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [newCategory] });

      expect(upsertCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 'category-new' }));
      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.categories[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });

    it('should process checklist_items and return results', () => {
      const newItem = makeChecklistItem({ id: 'item-new' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [newItem] });

      expect(upsertChecklistItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-new' }));
      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.checklist_items[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
    });
  });

  describe('settings', () => {
    it('should call upsertSetting for each setting', () => {
      const settings: Setting[] = [
        { key: 'default_box', value: 'today', updated_at: '2025-01-01T00:00:00.000Z' },
        { key: 'accent_color', value: 'purple', updated_at: '2025-01-01T00:00:00.000Z' },
      ];

      push({ settings });

      expect(upsertSetting).toHaveBeenCalledTimes(2);
      expect(upsertSetting).toHaveBeenCalledWith(settings[0]);
      expect(upsertSetting).toHaveBeenCalledWith(settings[1]);
    });

    it('should return accepted status for each setting using key as id', () => {
      const settings: Setting[] = [
        { key: 'default_box', value: 'today', updated_at: '2025-01-01T00:00:00.000Z' },
      ];

      push({ settings });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.settings[0]).toMatchObject({ id: 'default_box', status: PUSH_STATUSES.ACCEPTED });
    });

    it('should not call upsertSetting when settings array is empty', () => {
      push({ settings: [] });
      expect(upsertSetting).not.toHaveBeenCalled();
    });
  });

  describe('rejected record (blank title/name)', () => {
    it('should return status: rejected for task with empty title', () => {
      const blankTask = makeTask({ id: 'task-blank', title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-blank', status: 'rejected' });
    });

    it('should not call upsertTask when task title is empty', () => {
      const blankTask = makeTask({ title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      expect(upsertTask).not.toHaveBeenCalled();
    });

    it('should return status: rejected for task with whitespace-only title', () => {
      const blankTask = makeTask({ id: 'task-ws', title: '   ' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-ws', status: 'rejected' });
    });

    it('should return status: rejected for goal with empty title', () => {
      const blankGoal = makeGoal({ id: 'goal-blank', title: '' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [blankGoal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.goals[0]).toMatchObject({ id: 'goal-blank', status: 'rejected' });
    });

    it('should not call upsertGoal when goal title is empty', () => {
      const blankGoal = makeGoal({ title: '' });
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ goals: [blankGoal] });

      expect(upsertGoal).not.toHaveBeenCalled();
    });

    it('should return status: rejected for context with empty name', () => {
      const blankContext = makeContext({ id: 'context-blank', name: '' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [blankContext] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.contexts[0]).toMatchObject({ id: 'context-blank', status: 'rejected' });
    });

    it('should not call upsertContext when context name is empty', () => {
      const blankContext = makeContext({ name: '' });
      vi.mocked(getAllContexts).mockReturnValue([]);

      push({ contexts: [blankContext] });

      expect(upsertContext).not.toHaveBeenCalled();
    });

    it('should return status: rejected for category with empty name', () => {
      const blankCategory = makeCategory({ id: 'category-blank', name: '' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [blankCategory] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.categories[0]).toMatchObject({ id: 'category-blank', status: 'rejected' });
    });

    it('should not call upsertCategory when category name is empty', () => {
      const blankCategory = makeCategory({ name: '' });
      vi.mocked(getAllCategories).mockReturnValue([]);

      push({ categories: [blankCategory] });

      expect(upsertCategory).not.toHaveBeenCalled();
    });

    it('should return status: rejected for checklist_item with empty title', () => {
      const blankItem = makeChecklistItem({ id: 'item-blank', title: '' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [blankItem] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.checklist_items[0]).toMatchObject({ id: 'item-blank', status: 'rejected' });
    });

    it('should not call upsertChecklistItem when checklist item title is empty', () => {
      const blankItem = makeChecklistItem({ title: '' });
      vi.mocked(getAllChecklistItems).mockReturnValue([]);

      push({ checklist_items: [blankItem] });

      expect(upsertChecklistItem).not.toHaveBeenCalled();
    });

    it('should include reason field in rejected result', () => {
      const blankTask = makeTask({ title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toHaveProperty('reason');
    });

    it('should process valid records alongside rejected ones in same array', () => {
      const validTask = makeTask({ id: 'task-valid', title: 'Valid task' });
      const blankTask = makeTask({ id: 'task-blank', title: '' });
      vi.mocked(getAllTasks).mockReturnValue([]);

      push({ tasks: [validTask, blankTask] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks).toHaveLength(2);
      expect(results.tasks[0]).toMatchObject({ id: 'task-valid', status: 'created' });
      expect(results.tasks[1]).toMatchObject({ id: 'task-blank', status: 'rejected' });
    });

    it('should handle rejected task and created goal in same push', () => {
      const blankTask = makeTask({ id: 'task-blank', title: '' });
      const validGoal = makeGoal({ id: 'goal-valid', title: 'Valid goal' });
      vi.mocked(getAllTasks).mockReturnValue([]);
      vi.mocked(getAllGoals).mockReturnValue([]);

      push({ tasks: [blankTask], goals: [validGoal] });

      const results = parseResponse().results as Record<string, unknown[]>;
      expect(results.tasks[0]).toMatchObject({ id: 'task-blank', status: 'rejected' });
      expect(results.goals[0]).toMatchObject({ id: 'goal-valid', status: 'created' });
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