import '@angular/compiler';
import { Router } from '@angular/router';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { SessionService } from '../session.service';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

function createLoginComponent() {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  vi.stubGlobal('localStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn()
  });
  const session = new SessionService();
  return { component: new LoginComponent(router as unknown as Router, session), router, session };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('LoginComponent', () => {
  it('requires a username and password', async () => {
    const { component } = createLoginComponent();

    await component.login();
    expect(component.message).toBe('Ingrese un usuario.');

    component.username = 'student';
    await component.login();
    expect(component.message).toBe('Ingrese una contraseña.');
  });

  it('stores a successful login and navigates to the dashboard', async () => {
    const { component, router, session } = createLoginComponent();
    vi.mocked(axios.post).mockResolvedValue({
      data: { token: 'test-token', user: { username: 'student' } }
    } as never);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(session.token).toBe('test-token');
    expect(session.user).toEqual({ username: 'student' });
    expect(localStorage.setItem).not.toHaveBeenCalledWith('workshop_token', 'test-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('workshop_preferences', expect.any(String));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.busy).toBe(false);
  });

  it('shows a plain error message when authentication fails', async () => {
    const { component } = createLoginComponent();
    vi.mocked(axios.post).mockRejectedValue({ response: { data: { message: '<strong>Try again</strong>' } } });
    component.username = '<student>';
    component.password = 'wrong';

    await component.login();

    expect(component.message).toBe('No se pudo autenticar a <student>.\n<strong>Try again</strong>');
    expect(component.busy).toBe(false);
  });
});