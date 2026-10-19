import { describe, expect, it } from 'vitest';
import { formatTaskLabel } from './legacy-format';
import type { Task } from '../tasks/tasks.service';

describe('formatTaskLabel', () => {
  it('formats priority and owner', () => {
    expect(formatTaskLabel({ priority: 'high', owner: 'student' })).toBe('HIGH · STUDENT');
  });

  it('uses the existing fallbacks for missing or empty fields', () => {
    expect(formatTaskLabel({})).toBe('NORMAL · SIN-ASIGNAR');
    expect(formatTaskLabel({ priority: '', owner: '' })).toBe('NORMAL · SIN-ASIGNAR');
  });

  it('returns the no-data label for null and undefined inputs', () => {
    expect(formatTaskLabel(null)).toBe('SIN-DATOS');
    expect(formatTaskLabel(undefined)).toBe('SIN-DATOS');
  });

  it('accepts the task type used by TasksService', () => {
    const task: Task = {
      title: 'Task one',
      status: 'TODO',
      priority: 'high',
      owner: 'student'
    };

    expect(formatTaskLabel(task)).toBe('HIGH · STUDENT');
  });
});
