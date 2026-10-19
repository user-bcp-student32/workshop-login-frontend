import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PREFERENCES_STORAGE_KEY } from '../config/storage-keys';

interface UserPreferences {
  theme: string;
  showTips: boolean;
  compact: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  busy = false;
  message = '';
  preferences: UserPreferences = { theme: 'light', showTips: true, compact: false };

  constructor(private router: Router, private authService: AuthService) {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}') as Partial<UserPreferences>;
      this.preferences = { ...this.preferences, ...saved };
    } catch (error) {
      console.log('Preferences could not be loaded', error);
    }
  }

  async login(): Promise<void> {
    this.message = '';
    if (!this.username.trim()) {
      this.message = 'Ingrese un usuario.';
      return;
    }
    if (!this.password.trim()) {
      this.message = 'Ingrese una contraseña.';
      return;
    }

    this.busy = true;
    try {
      const session = await this.authService.login(this.username, this.password);
      if (!session) {
        this.message = 'No se pudo iniciar sesión. Intenta de nuevo.';
        return;
      }

      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences));
      await this.router.navigate(['/dashboard']);
    } catch {
      this.message = 'No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.';
    } finally {
      this.busy = false;
    }
  }
}
