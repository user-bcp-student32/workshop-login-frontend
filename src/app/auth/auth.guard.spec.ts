import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const loginUrlTree = {} as UrlTree;
  let authService: { session: { token: string; user: { username: string } } | null };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let guard: AuthGuard;

  beforeEach(() => {
    authService = { session: { token: 'test-token', user: { username: 'student' } } };
    router = { createUrlTree: vi.fn().mockReturnValue(loginUrlTree) };
    guard = new AuthGuard(authService as unknown as AuthService, router as unknown as Router);
  });

  it('allows dashboard activation when a session exists', () => {
    expect(guard.canActivate()).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login with a UrlTree when the session is absent', () => {
    authService.session = null;

    expect(guard.canActivate()).toBe(loginUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});