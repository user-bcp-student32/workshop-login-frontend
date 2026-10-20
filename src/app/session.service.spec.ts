import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SessionService', () => {
  it('keeps the bearer token in memory and clears legacy persisted session data', () => {
    const storage = {
      removeItem: vi.fn(),
      setItem: vi.fn()
    };
    vi.stubGlobal('localStorage', storage);
    const session = new SessionService();

    session.start('test-token', { username: 'student', role: 'STUDENT' });

    expect(session.token).toBe('test-token');
    expect(session.user?.username).toBe('student');
    expect(storage.removeItem).toHaveBeenCalledWith('workshop_token');
    expect(storage.removeItem).toHaveBeenCalledWith('workshop_user');
    expect(storage.setItem).not.toHaveBeenCalled();

    const reloadedSession = new SessionService();
    expect(reloadedSession.token).toBeNull();
    expect(reloadedSession.user).toBeNull();

    session.clear();

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
  });
});
