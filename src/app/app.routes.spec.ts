import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { AuthGuard } from './auth/auth.guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('protects dashboard and preserves login and fallback redirects', () => {
    const dashboardRoute = routes.find((route) => route.path === 'dashboard');
    const loginRoute = routes.find((route) => route.path === 'login');
    const emptyRoute = routes.find((route) => route.path === '');
    const wildcardRoute = routes.find((route) => route.path === '**');

    expect(dashboardRoute?.canActivate).toContain(AuthGuard);
    expect(loginRoute).toBeDefined();
    expect(emptyRoute?.redirectTo).toBe('login');
    expect(wildcardRoute?.redirectTo).toBe('login');
  });
});