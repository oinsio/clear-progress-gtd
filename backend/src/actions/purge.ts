import { getAllTasks, deleteTasksByIds } from '../sheets/tasks.sheet';
import { getAllGoals, deleteGoalsByIds } from '../sheets/goals.sheet';
import { getAllContexts, deleteContextsByIds } from '../sheets/contexts.sheet';
import { getAllCategories, deleteCategoriesByIds } from '../sheets/categories.sheet';
import { getAllChecklistItems, deleteChecklistItemsByIds } from '../sheets/checklists.sheet';
import { ERROR_MESSAGES } from '../helpers/constants';
import { jsonOk, jsonError, ERROR_CODES } from '../helpers/response';

export function purge(payload: { confirm?: unknown }): GoogleAppsScript.Content.TextOutput {
  if (payload?.confirm !== true) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.PURGE_CONFIRM_REQUIRED);
  }

  try {
    const deletedTaskIds = getAllTasks().filter(task => task.is_deleted).map(task => task.id);
    const deletedGoalIds = getAllGoals().filter(goal => goal.is_deleted).map(goal => goal.id);
    const deletedContextIds = getAllContexts().filter(context => context.is_deleted).map(context => context.id);
    const deletedCategoryIds = getAllCategories().filter(category => category.is_deleted).map(category => category.id);
    const deletedChecklistItemIds = getAllChecklistItems().filter(item => item.is_deleted).map(item => item.id);

    const tasks = deleteTasksByIds(deletedTaskIds);
    const goals = deleteGoalsByIds(deletedGoalIds);
    const contexts = deleteContextsByIds(deletedContextIds);
    const categories = deleteCategoriesByIds(deletedCategoryIds);
    const checklist_items = deleteChecklistItemsByIds(deletedChecklistItemIds);

    return jsonOk({ purged: { tasks, goals, contexts, categories, checklist_items } });
  } catch (e) {
    return jsonError(ERROR_CODES.INTERNAL_ERROR, String(e));
  }
}