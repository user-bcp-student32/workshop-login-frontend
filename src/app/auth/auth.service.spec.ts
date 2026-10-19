import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from './auth.service';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

describe('AuthService', () => {
  let service: AuthService;
  const localStorageMock = { setItem: vi.fn(), removeItem: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
    service = new AuthService();
  });

  it('preserves the login endpoint contract and keeps the session in memory', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { token: 'test-token', user: { username: 'student' } }
    } as never);

    const session = await service.login('student', 'Workshop123!');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/auth/login',
      { username: 'student', password: 'Workshop123!', client: 'angular-workshop' },
      { timeout: 5000 }
    );
    expect(session?.token).toBe('test-token');
    expect(service.session).toEqual(session);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('removes previously persisted session keys during initialization', () => {
    expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(1, 'workshop_token');
    expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(2, 'workshop_user');
    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
  });

  it('clears the in-memory session on logout', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { token: 'test-token', user: { username: 'student' } }
    } as never);
    await service.login('student', 'Workshop123!');

    service.logout();

    expect(service.session).toBeNull();
  });

  it('does not establish a session when the response has no token', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { user: { username: 'student' } } } as never);

    const session = await service.login('student', 'Workshop123!');

    expect(session).toBeNull();
    expect(service.session).toBeNull();
  });

  it('rejects an unexpected login response without data', async () => {
    vi.mocked(axios.post).mockResolvedValue(undefined as never);

    await expect(service.login('student', 'Workshop123!')).rejects.toThrow();
  });
});