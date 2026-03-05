import type { Task, Goal } from '../types';

const VALID_BOXES = ['inbox', 'today', 'week', 'later'];
const VALID_GOAL_STATUSES = ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'];

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = [];
  if (!task.id) errors.push('id is required');
  if (!task.title) errors.push('title is required');
  if (task.box && !VALID_BOXES.includes(task.box)) errors.push(`invalid box: ${task.box}`);
  if (!task.updated_at) errors.push('updated_at is required');
  if (typeof task.version !== 'number') errors.push('version must be a number');
  return errors;
}

export function validateGoal(goal: Partial<Goal>): string[] {
  const errors: string[] = [];
  if (!goal.id) errors.push('id is required');
  if (!goal.title) errors.push('title is required');
  if (goal.status && !VALID_GOAL_STATUSES.includes(goal.status)) {
    errors.push(`invalid status: ${goal.status}`);
  }
  if (!goal.updated_at) errors.push('updated_at is required');
  if (typeof goal.version !== 'number') errors.push('version must be a number');
  return errors;
}