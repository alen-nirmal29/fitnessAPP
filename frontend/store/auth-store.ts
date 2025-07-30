import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';
import { authAPI } from '@/services/api';

interface AuthStore extends AuthState {
  isInitialized: boolean;
  isInOnboarding: boolean;
  accessToken?: string;
  refreshToken?: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => void;
  initialize: () => void;
  setInOnboarding: (inOnboarding: boolean) => void;
  setUser: (user: UserProfile, accessToken?: string, refreshToken?: string) => void;
  getAccessToken: () => Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
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
      accessToken: undefined,
      refreshToken: undefined,

      initialize: () => {
        set({ isInitialized: true });
      },

      setUser: (user, accessToken, refreshToken) => {
        console.log('🔄 Transforming backend user data to frontend format...');
        console.log('📥 Backend user data:', user);
        
        // Transform backend user data to frontend format
        const transformedUser: UserProfile = {
          id: user.id.toString(),
          email: user.email,
          name: user.first_name || user.name || '',
          height: user.height,
          weight: user.weight,
          gender: user.gender,
          fitnessGoal: user.fitness_goal,
          specificGoal: user.specific_goal,
          hasCompletedOnboarding: user.has_completed_onboarding || false,
        };
        
        console.log('📤 Transformed user data:', transformedUser);
        console.log('🔐 Setting authentication state...');
        
        set({
          isAuthenticated: true,
          user: transformedUser,
          accessToken,
          refreshToken,
          isLoading: false,
        });
        
        console.log('✅ User authentication state updated');
      },

      getAccessToken: async () => {
        const token = await AsyncStorage.getItem('accessToken');
        return token;
      },

      setTokens: async (accessToken: string, refreshToken: string) => {
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.login({ email, password });

          // Store tokens in both state and AsyncStorage
          await get().setTokens(data.tokens.access, data.tokens.refresh);
          get().setUser(data.user, data.tokens.access, data.tokens.refresh);
        } catch (error: any) {
          set({
            error: error.message || 'Invalid email or password',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authAPI.register({ 
            email, 
            password, 
            confirm_password: password, // Add confirm_password field
            username: email, 
            first_name: name,
            last_name: ''
          });

          // Store tokens in both state and AsyncStorage
          await get().setTokens(data.tokens.access, data.tokens.refresh);
          get().setUser(data.user, data.tokens.access, data.tokens.refresh);
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create account',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔄 Attempting Google login with backend API...');
          console.log('📤 Sending ID token to backend...');
          const data = await authAPI.googleLogin(idToken);
          console.log('✅ Google login successful:', data);
          console.log('👤 User data received:', data.user);

          // Store tokens in both state and AsyncStorage
          console.log('💾 Storing tokens...');
          await get().setTokens(data.tokens.access, data.tokens.refresh);
          console.log('👤 Setting user in store...');
          get().setUser(data.user, data.tokens.access, data.tokens.refresh);
          console.log('✅ Google login completed successfully');
        } catch (error: any) {
          console.error('❌ Google login error:', error);
          set({
            error: error.message || 'Google login failed',
            isLoading: false,
          });
          throw error;
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
            accessToken: undefined,
            refreshToken: undefined,
          });
        }
      },

      updateProfile: async (profile) => {
        const { user } = get();
        if (!user || !user.id) {
          throw new Error('User not authenticated');
        }

        try {
          const updatedUser = await authAPI.updateProfile(profile);
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
            await authAPI.completeOnboarding();
            const updatedUser = { ...user, hasCompletedOnboarding: true };
            set({ user: updatedUser, isInOnboarding: false });
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
        }
      },
    }
  )
);
