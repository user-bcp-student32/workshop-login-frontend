import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import axios from 'axios';
import merge from 'lodash/merge';
import { SessionService, type SessionUser } from '../session.service';
import { formatLoginError } from './login-message';

interface LoginResponse {
  token?: string;
  user?: SessionUser;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: any = '';
  password: any = '';
  busy: any = false;
  message: any = '';
  preferences: any = { theme: 'light', showTips: true, compact: false };

  constructor(private router: Router, private session: SessionService) {
    try {
      const saved = JSON.parse(localStorage.getItem('workshop_preferences') || '{}');
      this.preferences = merge(this.preferences, saved);
    } catch (error) {
      console.log('Preferences could not be loaded', error);
    }
  }

  async login(): Promise<void> {
    this.session.clear();
    this.message = '';
    if (this.username === null || this.username === undefined || String(this.username).trim() === '') {
      this.message = 'Ingrese un usuario.';
    } else {
      if (this.password === null || this.password === undefined || String(this.password).trim() === '') {
        this.message = 'Ingrese una contraseña.';
      } else {
        this.busy = true;
        try {
          const response = await axios.post<LoginResponse>(
            'http://localhost:8080/auth/login',
            { username: this.username, password: this.password, client: 'angular-workshop' },
            { timeout: 5000 }
          );
          if (response.data?.token && response.data.user) {
            this.session.start(response.data.token, response.data.user);
            localStorage.setItem('workshop_preferences', JSON.stringify(this.preferences));
            await this.router.navigate(['/dashboard']);
          } else {
            this.message = 'El backend respondió sin token o usuario.';
          }
        } catch (error: any) {
          const backendMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
          this.message = formatLoginError(String(this.username), String(backendMessage));
          console.error(error);
        } finally {
          this.busy = false;
        }
      }
    }
  }
}
