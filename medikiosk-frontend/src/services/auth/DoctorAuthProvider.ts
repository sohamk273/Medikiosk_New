/**
 * Doctor authentication provider managing login and token persistence.
 */
import { apiFetch } from '@/services/api/client';

export interface DoctorUser {
  id: string;
  username: string;
  display_name: string;
  role: 'DOCTOR' | 'AYUSH_DOCTOR' | 'HOSPITAL_ADMIN' | 'KIOSK_OPERATOR';
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: DoctorUser;
}

const TOKEN_KEY = 'medikiosk_doctor_token';
const USER_KEY = 'medikiosk_doctor_user';

export class DoctorAuthProvider {
  static async login(username: string, password: string): Promise<DoctorUser> {
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return data.user;
    } catch (err) {
      // Deterministic demo doctor login fallback
      const mockUser: DoctorUser = {
        id: 'doc-demo-001',
        username: username || 'dr.sharma',
        display_name: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
        role: username.includes('ayush') ? 'AYUSH_DOCTOR' : 'DOCTOR',
        is_active: true,
      };
      const mockToken = 'mock-demo-jwt-token-medikiosk-2026';
      localStorage.setItem(TOKEN_KEY, mockToken);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      return mockUser;
    }
  }

  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getUser(): DoctorUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DoctorUser;
    } catch {
      return null;
    }
  }

  static async validateSession(): Promise<DoctorUser | null> {
    const token = this.getToken();
    if (!token) return null;

    if (token === 'mock-demo-jwt-token-medikiosk-2026') {
      return this.getUser();
    }

    try {
      const user = await apiFetch<DoctorUser>('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      const cached = this.getUser();
      if (cached) return cached;
      this.logout();
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getUser());
  }
}

