import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  rut: string;
  email: string;
  fullName: string;
  role: 'voter' | 'admin' | 'super_admin';
  organizationId: string;
  organizationName?: string; // Nombre de la organización
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requires2FA: boolean;
  pending2FAUserId: string | null;
}

export interface AuthActions {
  login: (rut: string, password: string) => Promise<void>;
  verify2FA: (userId: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  updateUser: (userData: Partial<User>) => void;
}

export interface RegisterData {
  rut: string;
  email: string;
  password: string;
  fullName: string;
  organizationId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://192.168.0.3:3001/api');

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    throw new Error('Invalid JSON response from server');
  }

  if (!response.ok) {
    // Si hay errores de validación, mostrarlos todos
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((err: any) =>
        `${err.path || err.param}: ${err.msg}`
      ).join(', ');
      throw new Error(errorMessages || data.message || `Error ${response.status}`);
    }
    throw new Error(data.message || JSON.stringify(data) || `Error ${response.status}`);
  }

  return data;
};

// Helper function to fetch CSRF token
const fetchCsrfToken = async () => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`);
  const data = await response.json();
  return data.csrfToken;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      pending2FAUserId: null,

      // Actions
      login: async (rut: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ rut, password }),
          });

          const data = await handleResponse(response);

          if (data.requires2FA) {
            set({
              requires2FA: true,
              pending2FAUserId: data.userId,
              isLoading: false,
            });
          } else if (data.success) {
            set({
              user: data.user,
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      verify2FA: async (userId: string, code: string) => {
        set({ isLoading: true, error: null });

        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ userId, code }),
          });

          const data = await handleResponse(response);

          if (data.success) {
            set({
              user: data.user,
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
              isAuthenticated: true,
              requires2FA: false,
              pending2FAUserId: null,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '2FA verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify(data),
          });

          const result = await handleResponse(response);

          set({
            isLoading: false,
            error: null,
          });

          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Call logout endpoint
        const { accessToken } = get();
        if (accessToken) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }).catch(console.error);
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requires2FA: false,
          pending2FAUserId: null,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await handleResponse(response);

          if (data.success) {
            set({
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
            });
          }
        } catch (error) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'voting-platform-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requires2FA: state.requires2FA,
        pending2FAUserId: state.pending2FAUserId,
      }),
    }
  )
);

export default useAuthStore;