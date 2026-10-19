import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from '../auth/auth.service';
import { TasksService } from './tasks.service';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

describe('TasksService', () => {
  let authService: AuthService;
  let service: TasksService;
  const localStorageMock = { removeItem: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
    authService = new AuthService();
    service = new TasksService(authService);
  });

  it('logs in and returns tasks using the authenticated owner and bearer token', async () => {
    const expectedTasks = [
      { title: 'Task one', status: 'TODO', priority: 'HIGH', owner: 'student' }
    ];
    vi.mocked(axios.post).mockResolvedValue({
      data: { token: 'test-token', user: { username: 'student' } }
    } as never);
    vi.mocked(axios.get).mockResolvedValue({ data: expectedTasks } as never);
    await authService.login('student', 'Workshop123!');

    const tasks = await service.getTasks('student');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/tasks?owner=student',
      { headers: { Authorization: 'Bearer test-token' } }
    );
    expect(tasks).toEqual(expectedTasks);
  });

  it('rejects task loading without a session', async () => {
    await expect(service.getTasks('student')).rejects.toThrow();
    expect(axios.get).not.toHaveBeenCalled();
  });
});