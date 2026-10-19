import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface Task {
  title: string;
  description?: string;
  status: string;
  priority?: number | string;
  owner?: string;
  label?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private authService: AuthService) {}

  async getTasks(owner: string): Promise<Task[]> {
    const session = this.authService.session;
    if (!session) {
      throw new Error('An authenticated session is required to load tasks.');
    }

    const url = `${environment.tasksUrl}?owner=${owner}`;
    const response = await axios.get<Task[]>(url, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    return response.data;
  }
}