import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { LEGACY_SESSION_STORAGE_KEYS } from '../config/storage-keys';

interface LoginRequest {
  username: string;
  password: string;
  client: string;
}

interface LoginResponse {
  token?: string;
  user: AuthUser;
}

export interface AuthUser {
  username: string;
  displayName?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const AUTH_CLIENT = 'angular-workshop';
const LOGIN_TIMEOUT_MS = 5000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentSession: AuthSession | null = null;

  constructor() {
    for (const key of LEGACY_SESSION_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  get session(): AuthSession | null {
    return this.currentSession;
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const request: LoginRequest = { username, password, client: AUTH_CLIENT };
    const response = await axios.post<LoginResponse>(environment.authLoginUrl, request, {
      timeout: LOGIN_TIMEOUT_MS
    });

    if (!response.data.token) {
      this.currentSession = null;
      return null;
    }

    this.currentSession = {
      token: response.data.token,
      user: response.data.user
    };
    return this.currentSession;
  }

  logout(): void {
    this.currentSession = null;
  }
}