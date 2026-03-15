import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/features/auth/types/auth.types';

const STORAGE_KEY = 'auth_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed<boolean>(() => {
    return user.value !== null;
  });

  const setUser = (userData: User | null): void => {
    user.value = userData;
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = (): void => {
    loading.value = true;
    error.value = null;
  };

  const logout = (): void => {
    user.value = null;
    error.value = null;
    localStorage.removeItem(STORAGE_KEY);
  };

  const restoreSession = (): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        user.value = parsed;
        return true;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return false;
  };

  const setError = (message: string | null): void => {
    error.value = message;
  };

  const setLoading = (value: boolean): void => {
    loading.value = value;
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    setUser,
    login,
    logout,
    restoreSession,
    setError,
    setLoading,
  };
}, {
  persist: {
    key: 'auth-store',
    pick: ['user'],
  },
});
