import '@angular/compiler';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { SessionService } from '../session.service';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

function createDashboard(session = new SessionService()) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const cdr = { detectChanges: vi.fn() };
  const zone = { run: (callback: () => void) => callback() };
  const component = new DashboardComponent(
    router as unknown as Router,
    cdr as unknown as ChangeDetectorRef,
    zone as unknown as NgZone,
    session
  );
  return { component, router, cdr, session };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('DashboardComponent session behavior', () => {
  it('redirects to login when no in-memory session exists', async () => {
    const { component, router } = createDashboard();

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('loads authenticated tasks, hides archived tasks and clears session on logout', async () => {
    const session = new SessionService();
    session.start('test-token', { username: 'student', displayName: 'Student' });
    const { component, router, cdr } = createDashboard(session);
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { id: 1, title: 'Open', description: 'Visible task', status: 'TODO', owner: 'student', priority: 'HIGH' },
        { id: 2, title: 'Archived', description: 'Hidden task', status: 'ARCHIVED', owner: 'student', priority: 'LOW' }
      ]
    } as never);

    await component.ngOnInit();

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/tasks?owner=student',
      { headers: { Authorization: 'Bearer test-token' } }
    );
    expect(component.user.displayName).toBe('Student');
    expect(component.tasks).toHaveLength(2);
    expect(component.visibleTasks).toHaveLength(1);
    expect(component.visibleTasks[0].label).toBe('HIGH · STUDENT');
    expect(component.loading).toBe(false);
    expect(cdr.detectChanges).toHaveBeenCalled();

    await component.logout();

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows the request error and stops loading when task retrieval fails', async () => {
    const session = new SessionService();
    session.start('test-token', { username: 'student' });
    const { component } = createDashboard(session);
    vi.mocked(axios.get).mockRejectedValue(new Error('network unavailable'));

    await component.ngOnInit();

    expect(component.error).toBe('network unavailable');
    expect(component.loading).toBe(false);
  });

  it('maps known statuses and preserves unknown labels', () => {
    const { component } = createDashboard();

    expect(component.statusLabel('todo')).toBe('Por hacer');
    expect(component.statusLabel('CUSTOM')).toBe('CUSTOM');
  });
});
