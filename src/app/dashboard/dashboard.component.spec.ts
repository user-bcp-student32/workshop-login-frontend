import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TasksService } from '../tasks/tasks.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent characterization', () => {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key))
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let authService: { session: { token: string; user: { username: string } } | null; logout: ReturnType<typeof vi.fn> };
  let tasksService: { getTasks: ReturnType<typeof vi.fn> };
  let component: DashboardComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal('localStorage', localStorageMock);
    router = { navigate: vi.fn().mockResolvedValue(true) };
    authService = {
      session: { token: 'test-token', user: { username: 'student' } },
      logout: vi.fn()
    };
    tasksService = {
      getTasks: vi.fn().mockResolvedValue([
        { title: 'Task one', status: 'TODO', priority: 'HIGH', owner: 'student' }
      ])
    };
    const changeDetector = { detectChanges: vi.fn() };
    const zone = { run: (callback: () => void) => callback() };
    component = new DashboardComponent(
      router as unknown as Router,
      authService as unknown as AuthService,
      tasksService as unknown as TasksService,
      changeDetector as unknown as ChangeDetectorRef,
      zone as unknown as NgZone
    );
  });

  it('loads tasks with the current owner and bearer token, then renders them', async () => {
    await component.ngOnInit();

    expect(tasksService.getTasks).toHaveBeenCalledWith('student');
    expect(component.visibleTasks).toHaveLength(1);
    expect(component.visibleTasks[0].label).toBe('HIGH · STUDENT');
    expect(component.loading).toBe(false);
  });

  it('filters archived tasks and sorts numeric priorities descending', async () => {
    tasksService.getTasks.mockResolvedValue([
      { title: 'Low', status: 'TODO', priority: 1 },
      { title: 'Archived', status: 'ARCHIVED', priority: 99 },
      { title: 'High', status: 'TODO', priority: 8 }
    ]);

    await component.ngOnInit();

    expect(component.visibleTasks.map((task) => task.title)).toEqual(['High', 'Low']);
  });

  it('sorts string priorities using the existing descending comparison', async () => {
    tasksService.getTasks.mockResolvedValue([
      { title: 'Low', status: 'TODO', priority: 'LOW' },
      { title: 'High', status: 'TODO', priority: 'HIGH' }
    ]);

    await component.ngOnInit();

    expect(component.visibleTasks.map((task) => task.title)).toEqual(['Low', 'High']);
  });

  it('maps known task statuses and preserves unknown statuses', () => {
    expect(component.statusLabel('done')).toBe('Completado');
    expect(component.statusLabel('CUSTOM')).toBe('CUSTOM');
  });

  it('clears the current session and navigates to login on logout', async () => {
    await component.logout();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not perform route redirection when the session is absent', async () => {
    authService.session = null;

    await component.ngOnInit();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(tasksService.getTasks).not.toHaveBeenCalled();
  });

  it('shows a task API detail when loading fails', async () => {
    tasksService.getTasks.mockRejectedValue({ response: { data: { detail: 'Task API detail' } } });

    await component.ngOnInit();

    expect(component.error).toBe('Task API detail');
    expect(component.loading).toBe(false);
  });

  it('shows an invalid-token response detail without silently ending the session', async () => {
    tasksService.getTasks.mockRejectedValue({ response: { status: 401, data: { detail: 'Invalid token' } } });

    await component.ngOnInit();

    expect(component.error).toBe('Invalid token');
    expect(component.loading).toBe(false);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows the message when task loading rejects due to an external timeout', async () => {
    tasksService.getTasks.mockRejectedValue(new Error('timeout of external request'));

    await component.ngOnInit();

    expect(component.error).toBe('timeout of external request');
    expect(component.loading).toBe(false);
  });

  it('falls back to the error message or a generic task error', async () => {
    tasksService.getTasks.mockRejectedValueOnce(new Error('Network unavailable'));
    await component.ngOnInit();
    expect(component.error).toBe('Network unavailable');

    tasksService.getTasks.mockRejectedValueOnce(null);
    await component.ngOnInit();
    expect(component.error).toBe('No se pudo cargar el dashboard');
  });
});