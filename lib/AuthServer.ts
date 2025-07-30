export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface User {
    id: string;
    username: string;
    email?: string;
    role?: string;
    created_at?: string;
  }
  
  export interface LoginResponse {
    user: User;
    token?: string;
    message?: string;
  }
  
  export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  class AuthServer {
    private baseUrl = '/api/auth';
  
        private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'Content-Type': 'application/json' },
          ...options,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || 'Request failed');
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        throw new Error(message);
      }
    }
  
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
      return this.request<LoginResponse>('/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    }
  
    async logout(): Promise<void> {
      await this.request<void>('/logout', { method: 'POST' });
    }
  
    async checkAuth(): Promise<User | null> {
      try {
        return await this.request<User>('/check');
      } catch {
        return null;
      }
    }
  }
  
  export default new AuthServer();