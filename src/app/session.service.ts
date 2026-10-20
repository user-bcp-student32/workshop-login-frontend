import { Injectable } from '@angular/core';

export interface SessionUser {
  username: string;
  displayName?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private currentToken: string | null = null;
  private currentUser: SessionUser | null = null;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('workshop_token');
      localStorage.removeItem('workshop_user');
    }
  }

  get token(): string | null {
    return this.currentToken;
  }

  get user(): SessionUser | null {
    return this.currentUser;
  }

  start(token: string, user: SessionUser): void {
    this.currentToken = token;
    this.currentUser = user;
  }

  clear(): void {
    this.currentToken = null;
    this.currentUser = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('workshop_token');
      localStorage.removeItem('workshop_user');
    }
  }
}
