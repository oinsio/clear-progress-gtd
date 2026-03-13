import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purge } from './purge';
import { ERROR_CODES } from '../helpers/response';

vi.mock('../sheets/tasks.sheet', () => ({
  getAllTasks: vi.fn(),
  deleteTasksByIds: vi.fn(),
}));
vi.mock('../sheets/goals.sheet', () => ({
  getAllGoals: vi.fn(),
  deleteGoalsByIds: vi.fn(),
}));
vi.mock('../sheets/contexts.sheet', () => ({
  getAllContexts: vi.fn(),
  deleteContextsByIds: vi.fn(),
}));
vi.mock('../sheets/categories.sheet', () => ({
  getAllCategories: vi.fn(),
  deleteCategoriesByIds: vi.fn(),
}));
vi.mock('../sheets/checklists.sheet', () => ({
  getAllChecklistItems: vi.fn(),
  deleteChecklistItemsByIds: vi.fn(),
}));

import { getAllTasks, deleteTasksByIds } from '../sheets/tasks.sheet';
import { getAllGoals, deleteGoalsByIds } from '../sheets/goals.sheet';
import { getAllContexts, deleteContextsByIds } from '../sheets/contexts.sheet';
import { getAllCategories, deleteCategoriesByIds } from '../sheets/categories.sheet';
import { getAllChecklistItems, deleteChecklistItemsByIds } from '../sheets/checklists.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

const getAllMocks = [getAllTasks, getAllGoals, getAllContexts, getAllCategories, getAllChecklistItems];
const deleteMocks = [deleteTasksByIds, deleteGoalsByIds, deleteContextsByIds, deleteCategoriesByIds, deleteChecklistItemsByIds];

describe('purge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMocks.forEach(mock => vi.mocked(mock).mockReturnValue([]));
    deleteMocks.forEach(mock => vi.mocked(mock).mockReturnValue(0));
  });

  it('should return error when confirm is missing', () => {
    purge({});
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it('should return error when confirm is false', () => {
    purge({ confirm: false });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it('should return error when payload is null', () => {
    purge(null as never);
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it('should return error when payload is undefined', () => {
    purge(undefined as never);
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it.each([1, 'true', {}, []])('should return error when confirm is %s (truthy but not true)', (value) => {
    purge({ confirm: value });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it('should return zeros when no soft-deleted records exist', () => {
    purge({ confirm: true });
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.purged).toEqual({ tasks: 0, goals: 0, contexts: 0, categories: 0, checklist_items: 0 });
  });

  it('should delete soft-deleted tasks and return correct count', () => {
    vi.mocked(getAllTasks).mockReturnValue([
      { id: 'task-1', is_deleted: true } as never,
      { id: 'task-2', is_deleted: false } as never,
    ]);
    vi.mocked(deleteTasksByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteTasksByIds).toHaveBeenCalledWith(['task-1']);
    expect(response.purged).toMatchObject({ tasks: 1 });
  });

  it('should not delete records where is_deleted is false', () => {
    vi.mocked(getAllTasks).mockReturnValue([
      { id: 'task-1', is_deleted: false } as never,
      { id: 'task-2', is_deleted: false } as never,
    ]);

    purge({ confirm: true });

    expect(deleteTasksByIds).toHaveBeenCalledWith([]);
  });

  it('should delete soft-deleted goals and return correct count', () => {
    vi.mocked(getAllGoals).mockReturnValue([
      { id: 'goal-1', is_deleted: true } as never,
      { id: 'goal-2', is_deleted: false } as never,
    ]);
    vi.mocked(deleteGoalsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteGoalsByIds).toHaveBeenCalledWith(['goal-1']);
    expect(response.purged).toMatchObject({ goals: 1 });
  });

  it('should delete only soft-deleted contexts and exclude active ones', () => {
    vi.mocked(getAllContexts).mockReturnValue([
      { id: 'ctx-1', is_deleted: true } as never,
      { id: 'ctx-2', is_deleted: false } as never,
    ]);
    vi.mocked(deleteContextsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteContextsByIds).toHaveBeenCalledWith(['ctx-1']);
    expect(response.purged).toMatchObject({ contexts: 1 });
  });

  it('should delete only soft-deleted categories and exclude active ones', () => {
    vi.mocked(getAllCategories).mockReturnValue([
      { id: 'cat-1', is_deleted: true } as never,
      { id: 'cat-2', is_deleted: false } as never,
    ]);
    vi.mocked(deleteCategoriesByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteCategoriesByIds).toHaveBeenCalledWith(['cat-1']);
    expect(response.purged).toMatchObject({ categories: 1 });
  });

  it('should delete only soft-deleted checklist items and exclude active ones', () => {
    vi.mocked(getAllChecklistItems).mockReturnValue([
      { id: 'cl-1', is_deleted: true } as never,
      { id: 'cl-2', is_deleted: false } as never,
    ]);
    vi.mocked(deleteChecklistItemsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteChecklistItemsByIds).toHaveBeenCalledWith(['cl-1']);
    expect(response.purged).toMatchObject({ checklist_items: 1 });
  });

  it('should return INTERNAL_ERROR when a sheet operation throws', () => {
    vi.mocked(getAllTasks).mockImplementation(() => { throw new Error('Sheet error'); });

    purge({ confirm: true });
    const response = parseResponse();

    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('should delete soft-deleted records for all entity types', () => {
    vi.mocked(getAllTasks).mockReturnValue([{ id: 'task1', is_deleted: true } as never]);
    vi.mocked(getAllGoals).mockReturnValue([{ id: 'goal1', is_deleted: true } as never]);
    vi.mocked(getAllContexts).mockReturnValue([{ id: 'context1', is_deleted: true } as never]);
    vi.mocked(getAllCategories).mockReturnValue([{ id: 'category1', is_deleted: true } as never]);
    vi.mocked(getAllChecklistItems).mockReturnValue([{ id: 'checklist1', is_deleted: true } as never]);
    vi.mocked(deleteTasksByIds).mockReturnValue(1);
    vi.mocked(deleteGoalsByIds).mockReturnValue(1);
    vi.mocked(deleteContextsByIds).mockReturnValue(1);
    vi.mocked(deleteCategoriesByIds).mockReturnValue(1);
    vi.mocked(deleteChecklistItemsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = parseResponse();

    expect(deleteGoalsByIds).toHaveBeenCalledWith(['goal1']);
    expect(deleteContextsByIds).toHaveBeenCalledWith(['context1']);
    expect(deleteCategoriesByIds).toHaveBeenCalledWith(['category1']);
    expect(deleteChecklistItemsByIds).toHaveBeenCalledWith(['checklist1']);
    expect(response.purged).toEqual({ tasks: 1, goals: 1, contexts: 1, categories: 1, checklist_items: 1 });
  });
});