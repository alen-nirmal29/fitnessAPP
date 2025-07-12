import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';

interface AuthStore extends AuthState {
  isInitialized: boolean;
  isInOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  initialize: () => void;
  setInOnboarding: (inOnboarding: boolean) => void;
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

      initialize: () => {
        console.log('Auth store initialized');
        set({ isInitialized: true });
      },

      login: async (email: string, password: string) => {
        console.log('Login attempt:', email);
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful login
          const user: UserProfile = {
            id: '1',
            email,
            name: 'User',
            hasCompletedOnboarding: true, // Set to true for existing users
          };
          
          console.log('Login successful:', user);
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
          });
        } catch (error) {
          console.error('Login error:', error);
          set({
            error: 'Invalid email or password',
            isLoading: false,
          });
        }
      },

      signup: async (email: string, password: string, name: string) => {
        console.log('Signup attempt:', email, name);
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // Simulating API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful signup
          const user: UserProfile = {
            id: '1',
            email,
            name,
            hasCompletedOnboarding: false,
          };
          
          console.log('Signup successful:', user);
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
          });
        } catch (error) {
          console.error('Signup error:', error);
          set({
            error: 'Failed to create account',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        console.log('Logout initiated');
        set({ isLoading: true });
        
        try {
          // Clear persisted storage first
          await AsyncStorage.removeItem('auth-storage');
          await AsyncStorage.removeItem('workout-storage');
          await AsyncStorage.removeItem('workout-session-storage');
          console.log('Storage cleared');
          
          // Clear all auth state completely
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
            isInitialized: true, // Keep initialized true
            isInOnboarding: false, // Reset onboarding state
          });
          
          console.log('Auth state cleared - logout complete');
        } catch (error) {
          console.error('Logout error:', error);
          // Force clear state even if storage clear fails
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
            isInitialized: true,
            isInOnboarding: false,
          });
        }
      },

      updateProfile: (profile: Partial<UserProfile>) => {
        const { user } = get();
        console.log('Updating profile:', profile);
        console.log('Current user:', user);
        
        if (user) {
          const updatedUser = {
            ...user,
            ...profile,
          };
          
          console.log('Updated user:', updatedUser);
          
          set({
            user: updatedUser,
          });
          
          // Force a small delay to ensure state is updated
          setTimeout(() => {
            console.log('Profile update completed, current user:', get().user);
          }, 100);
        }
      },

      completeOnboarding: () => {
        const { user } = get();
        console.log('Completing onboarding for user:', user);
        
        if (user) {
          const updatedUser = {
            ...user,
            hasCompletedOnboarding: true,
          };
          
          console.log('Onboarding completed for user:', updatedUser);
          
          set({
            user: updatedUser,
            isInOnboarding: false,
          });
        }
      },

      setInOnboarding: (inOnboarding: boolean) => {
        console.log('Setting onboarding state:', inOnboarding);
        set({ isInOnboarding: inOnboarding });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Called when the persisted state is loaded
        console.log('Auth store rehydrated:', state);
        if (state) {
          state.initialize();
        }
      },
    }
  )
);