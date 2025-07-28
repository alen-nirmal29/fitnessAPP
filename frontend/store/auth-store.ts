import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';
import { AUTH_ENDPOINTS, getAuthHeaders } from '@/constants/api';

interface AuthStore extends AuthState {
  isInitialized: boolean;
  isInOnboarding: boolean;
  idToken?: string;
  refreshToken?: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => void;
  initialize: () => void;
  setInOnboarding: (inOnboarding: boolean) => void;
  setUser: (user: UserProfile, idToken?: string, refreshToken?: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      isInOnboarding: false,
      user: null,
      error: null,
      idToken: undefined,
      refreshToken: undefined,

      initialize: () => {
        set({ isInitialized: true });
      },

      setUser: (user, idToken, refreshToken) => {
        set({
          isAuthenticated: true,
          user,
          idToken,
          refreshToken,
          isLoading: false,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.error || 'Login failed');

          // Store tokens
          await AsyncStorage.setItem('accessToken', data.tokens.access);
          await AsyncStorage.setItem('refreshToken', data.tokens.refresh);

          get().setUser(data.user, data.tokens.access, data.tokens.refresh);
        } catch (error: any) {
          set({
            error: error.message || 'Invalid email or password',
            isLoading: false,
          });
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(AUTH_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              password, 
              username: email, 
              first_name: name,
              last_name: ''
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.error || 'Registration failed');

          // Store tokens
          await AsyncStorage.setItem('accessToken', data.tokens.access);
          await AsyncStorage.setItem('refreshToken', data.tokens.refresh);

          get().setUser(data.user, data.tokens.access, data.tokens.refresh);
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create account',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Clear all auth data
          await AsyncStorage.removeItem('auth-storage');
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
            isInitialized: true,
            isInOnboarding: false,
            idToken: undefined,
            refreshToken: undefined,
          });
        }
      },

      updateProfile: async (profile) => {
        const { user } = get();
        if (!user || !user.id) {
          console.error('Cannot update profile: user or user.id is undefined');
          throw new Error('User not authenticated');
        }

        try {
          const headers = await getAuthHeaders();
          const res = await fetch(AUTH_ENDPOINTS.PROFILE_UPDATE, {
            method: 'PUT',
            headers,
            body: JSON.stringify(profile),
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Failed to update profile');
          }

          const updatedUser = await res.json();
          set({ user: updatedUser });
        } catch (error: any) {
          console.error('Profile update error:', error);
          throw error;
        }
      },

      completeOnboarding: async () => {
        const { user } = get();
        if (user) {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(AUTH_ENDPOINTS.ONBOARDING_COMPLETE, {
              method: 'POST',
              headers,
            });
            
            if (res.ok) {
              const updatedUser = { ...user, hasCompletedOnboarding: true };
              set({ user: updatedUser, isInOnboarding: false });
            }
          } catch (error) {
            console.error('Error completing onboarding:', error);
          }
        }
      },

      setInOnboarding: (inOnboarding: boolean) => {
        set({ isInOnboarding: inOnboarding });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
          console.log('Auth state rehydrated:', state);
        }
      },
    }
  )
);
