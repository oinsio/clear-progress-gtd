import { VALIDATION_MESSAGES, VALID_BOXES, VALID_GOAL_STATUSES } from './constants';
import type { Task, Goal } from '../types';

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = [];
  if (!task.id) errors.push(VALIDATION_MESSAGES.ID_REQUIRED);
  if (!task.title) errors.push(VALIDATION_MESSAGES.TITLE_REQUIRED);
  if (task.box && !VALID_BOXES.includes(task.box)) errors.push(`invalid box: ${task.box}`);
  if (!task.updated_at) errors.push(VALIDATION_MESSAGES.UPDATED_AT_REQUIRED);
  if (typeof task.version !== 'number') errors.push(VALIDATION_MESSAGES.VERSION_NOT_NUMBER);
  return errors;
}

export function validateGoal(goal: Partial<Goal>): string[] {
  const errors: string[] = [];
  if (!goal.id) errors.push(VALIDATION_MESSAGES.ID_REQUIRED);
  if (!goal.title) errors.push(VALIDATION_MESSAGES.TITLE_REQUIRED);
  if (goal.status && !VALID_GOAL_STATUSES.includes(goal.status)) {
    errors.push(`invalid status: ${goal.status}`);
  }
  if (!goal.updated_at) errors.push(VALIDATION_MESSAGES.UPDATED_AT_REQUIRED);
  if (typeof goal.version !== 'number') errors.push(VALIDATION_MESSAGES.VERSION_NOT_NUMBER);
  return errors;
}