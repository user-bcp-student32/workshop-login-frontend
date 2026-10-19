import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../auth/auth.service';
import { Task, TasksService } from '../tasks/tasks.service';
import { formatTaskLabel } from '../utils/legacy-format';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
  RESUELTO: 'Resuelto',
  COMPLETED: 'Completado'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  visibleTasks: Task[] = [];
  user: AuthUser = { username: '' };
  loading = true;
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private tasksService: TasksService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  statusLabel(status: string): string {
    return STATUS_LABELS[(status || '').toUpperCase()] || status;
  }

  async ngOnInit(): Promise<void> {
    const session = this.authService.session;
    if (!session) {
      return;
    }
    this.user = session.user;

    try {
      const tasks = await this.tasksService.getTasks(this.user.username);
      const visibleTasks = tasks
        .filter((task) => task.status !== 'ARCHIVED')
        .map((task) => ({ ...task, label: formatTaskLabel(task) }))
        .sort(compareTasksByPriority);

      // axios resuelve a veces fuera de la zona de Angular (más aún llegando
      // por navegación desde el login): forzamos volver a entrar a la zona
      // y disparamos detectChanges a mano para no depender de que Angular
      // lo detecte solo.
      this.zone.run(() => {
        this.tasks = tasks;
        this.visibleTasks = visibleTasks;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } catch (error: unknown) {
      this.zone.run(() => {
        this.error = getTaskErrorMessage(error);
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}

function compareTasksByPriority(left: Task, right: Task): number {
  const leftPriority = left.priority ?? 0;
  const rightPriority = right.priority ?? 0;
  if (typeof leftPriority === 'number' && typeof rightPriority === 'number') {
    return rightPriority - leftPriority;
  }
  return String(rightPriority).localeCompare(String(leftPriority));
}

function getTaskErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const taskError = error as {
      response?: { data?: { detail?: unknown } };
      message?: unknown;
    };
    if (typeof taskError.response?.data?.detail === 'string') {
      return taskError.response.data.detail;
    }
    if (typeof taskError.message === 'string') {
      return taskError.message;
    }
  }
  return 'No se pudo cargar el dashboard';
}
