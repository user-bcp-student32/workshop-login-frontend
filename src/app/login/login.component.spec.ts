import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTemplate } from '@angular/compiler';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent characterization', () => {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key))
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let authService: { login: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal('localStorage', localStorageMock);
    router = { navigate: vi.fn().mockResolvedValue(true) };
    authService = { login: vi.fn().mockResolvedValue({ token: 'test-token', user: { username: 'student' } }) };
  });

  it('uses default preferences when none are stored', () => {
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);

    expect(component.preferences).toEqual({ theme: 'light', showTips: true, compact: false });
  });

  it('overrides saved preference fields and preserves defaults for missing fields', () => {
    storage.set('workshop_preferences', JSON.stringify({ theme: 'dark' }));

    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);

    expect(component.preferences).toEqual({ theme: 'dark', showTips: true, compact: false });
  });

  it('authenticates and navigates after receiving a session', async () => {
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(authService.login).toHaveBeenCalledWith('student', 'Workshop123!');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.busy).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('workshop_preferences', expect.any(String));
  });

  it('reports missing credentials as plain text without calling the auth service', async () => {
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);

    await component.login();

    expect(component.message).toBe('Ingrese un usuario.');
    component.username = 'student';
    await component.login();
    expect(component.message).toBe('Ingrese una contraseña.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows a safe message when the response has no token', async () => {
    authService.login.mockResolvedValue(null);
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.message).toBe('No se pudo iniciar sesión. Intenta de nuevo.');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('shows a safe generic message when authentication fails', async () => {
    authService.login.mockRejectedValue(new Error('Sensitive backend detail'));
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
    component.username = 'student';
    component.password = 'wrong-password';

    await component.login();

    expect(component.message).toBe('No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.');
    expect(component.message).not.toContain('Sensitive backend detail');
    expect(component.busy).toBe(false);
  });

  it('shows the generic authentication message when the backend is unavailable', async () => {
    authService.login.mockRejectedValue(new Error('Network Error'));
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.message).toBe('No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.');
    expect(component.busy).toBe(false);
  });

  it('shows the generic authentication message when the login request times out', async () => {
    const timeoutError = Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' });
    authService.login.mockRejectedValue(timeoutError);
    const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.message).toBe('No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.');
    expect(component.busy).toBe(false);
  });

  it('renders the message as text instead of binding it as HTML', () => {
    const templatePath = new URL('./login.component.html', import.meta.url);
    const template = readFileSync(templatePath, 'utf8');
    const parsedTemplate = parseTemplate(template, templatePath.pathname);

    expect(parsedTemplate.errors).toBeNull();
    expect(template).toContain('{{ message }}');
    expect(template).not.toContain('[innerHTML]');
  });
});