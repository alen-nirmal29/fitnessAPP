import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
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
  saveUserData: (data: any, step?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchCompleteProfile: () => Promise<void>;
  completeOnboarding: () => void;
  initialize: () => Promise<void>;
  setInOnboarding: (inOnboarding: boolean) => void;
  setUser: (user: UserProfile, accessToken?: string, refreshToken?: string) => void;
  getAccessToken: () => Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuthData: () => Promise<void>;
  checkAuthState: () => AuthStore;
  refreshToken: () => Promise<any>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isInOnboarding: false,
  user: null,
  error: null,
  accessToken: undefined,
  refreshToken: undefined,

  initialize: async () => {
    try {
      console.log('🚀 Initializing authentication state...');
      
      // First, clear any invalid tokens
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      // Clear invalid tokens immediately
      if (accessToken === 'None' || accessToken === 'null' || 
          refreshToken === 'None' || refreshToken === 'null') {
        console.log('🧹 Clearing invalid tokens...');
        await get().clearAuthData();
        set({ isInitialized: true });
        return;
      }
      
      // Check if tokens exist and are valid
      if (accessToken && accessToken.length > 10) {
        console.log('🔍 Found tokens in storage, validating...');
        set({ accessToken, refreshToken });
        
        try {
          console.log('🔄 Attempting to fetch user profile...');
          await get().fetchProfile();
          console.log('✅ User profile fetched successfully');
          
          // Fetch complete profile to ensure all user data is available
          try {
            console.log('🔄 Fetching complete profile during initialization...');
            await get().fetchCompleteProfile();
            console.log('✅ Complete profile fetched successfully during initialization');
          } catch (completeProfileError) {
            console.error('⚠️ Error fetching complete profile during initialization:', completeProfileError);
            // Continue even if complete profile fetch fails
          }
        } catch (error: any) {
          console.error('❌ Failed to fetch user profile:', error);
          
          // If it's a 401 error, try to refresh the token
          if (error.message?.includes('401') || error.message?.includes('Authentication expired')) {
            console.log('🔄 Token expired, attempting refresh...');
            try {
              await get().refreshToken();
              console.log('✅ Token refreshed successfully');
              
              // Try to fetch profile and complete profile after token refresh
              try {
                await get().fetchProfile();
                console.log('✅ User profile fetched successfully after token refresh');
                
                try {
                  console.log('🔄 Fetching complete profile after token refresh...');
                  await get().fetchCompleteProfile();
                  console.log('✅ Complete profile fetched successfully after token refresh');
                } catch (completeProfileError) {
                  console.error('⚠️ Error fetching complete profile after token refresh:', completeProfileError);
                  // Continue even if complete profile fetch fails
                }
              } catch (profileError) {
                console.error('❌ Failed to fetch user profile after token refresh:', profileError);
                console.log('🧹 Clearing invalid tokens...');
                await get().clearAuthData();
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              console.log('🧹 Clearing invalid tokens...');
              await get().clearAuthData();
            }
          } else {
            console.log('🧹 Clearing invalid tokens...');
            await get().clearAuthData();
          }
        }
      } else {
        console.log('📝 No valid tokens found, user needs to login');
      }
      
      set({ isInitialized: true });
      console.log('✅ Authentication initialization complete');
    } catch (error) {
      console.error('❌ Error during authentication initialization:', error);
      set({ isInitialized: true });
    }
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
    console.log('📋 hasCompletedOnboarding:', transformedUser.hasCompletedOnboarding);
    
    set({
      isAuthenticated: true,
      user: transformedUser,
      accessToken,
      refreshToken,
      isLoading: false,
    });
    
    console.log('✅ User authentication state updated');
    console.log('🔐 isAuthenticated set to: true');
  },

  getAccessToken: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token || token === 'None' || token === 'null') {
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error retrieving access token:', error);
      return null;
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    console.log('💾 Storing tokens in AsyncStorage...');
    
    // Validate tokens before storing
    if (!accessToken || accessToken === 'None' || accessToken === 'null') {
      console.error('❌ Invalid access token:', accessToken);
      throw new Error('Invalid access token received');
    }
    
    if (!refreshToken || refreshToken === 'None' || refreshToken === 'null') {
      console.error('❌ Invalid refresh token:', refreshToken);
      throw new Error('Invalid refresh token received');
    }
    
    console.log('🔑 Access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    console.log('🔄 Refresh token (first 20 chars):', refreshToken.substring(0, 20) + '...');
    
    try {
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      console.log('✅ Tokens stored successfully in AsyncStorage');
      
      set({ accessToken, refreshToken });
      console.log('✅ Tokens also stored in Zustand state');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  },

  clearAuthData: async () => {
    console.log('🧹 Clearing all authentication data...');
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('auth-storage');
      await AsyncStorage.removeItem('auth-store-storage');
      
      // Reset Zustand state
      set({
        isAuthenticated: false,
        user: null,
        accessToken: undefined,
        refreshToken: undefined,
        error: null,
      });
      
      console.log('✅ Authentication data cleared');
    } catch (error) {
      console.error('❌ Error clearing authentication data:', error);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authAPI.login({ email, password });
      console.log('🔐 Login API response:', data);

      // Validate response structure
      if (!data.tokens || !data.tokens.access || !data.tokens.refresh) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Store tokens in both state and AsyncStorage
      await get().setTokens(data.tokens.access, data.tokens.refresh);
      console.log('💾 Tokens stored, setting user...');
      get().setUser(data.user, data.tokens.access, data.tokens.refresh);
      
      // Fetch complete profile to ensure all user data is available
      try {
        console.log('🔄 Fetching complete profile after login...');
        await get().fetchCompleteProfile();
        console.log('✅ Complete profile fetched successfully after login');
      } catch (profileError) {
        console.error('⚠️ Error fetching complete profile after login:', profileError);
        // Continue even if profile fetch fails
      }
      
      console.log('✅ Login completed successfully');
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
        confirm_password: password,
        username: email, 
        first_name: name,
        last_name: ''
      });
      console.log('🔐 Signup API response:', data);

      // Validate response structure
      if (!data.tokens || !data.tokens.access || !data.tokens.refresh) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Store tokens in both state and AsyncStorage
      await get().setTokens(data.tokens.access, data.tokens.refresh);
      console.log('💾 Tokens stored, setting user...');
      get().setUser(data.user, data.tokens.access, data.tokens.refresh);
      
      // Fetch complete profile to ensure all user data is available
      try {
        console.log('🔄 Fetching complete profile after signup...');
        await get().fetchCompleteProfile();
        console.log('✅ Complete profile fetched successfully after signup');
      } catch (profileError) {
        console.error('⚠️ Error fetching complete profile after signup:', profileError);
        // Continue even if profile fetch fails
      }
      
      console.log('✅ Signup completed successfully');
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
      const data = await authAPI.googleLogin({ id_token: idToken });
      console.log('✅ Google login successful:', data);
      console.log('👤 User data received:', data.user);

      // Validate response structure
      if (!data.tokens || !data.tokens.access || !data.tokens.refresh) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Store tokens in both state and AsyncStorage
      console.log('💾 Storing tokens...');
      await get().setTokens(data.tokens.access, data.tokens.refresh);
      console.log('👤 Setting user in store...');
      get().setUser(data.user, data.tokens.access, data.tokens.refresh);
      
      // Fetch complete profile to ensure all user data is available
      try {
        console.log('🔄 Fetching complete profile after Google login...');
        await get().fetchCompleteProfile();
        console.log('✅ Complete profile fetched successfully after Google login');
      } catch (profileError) {
        console.error('⚠️ Error fetching complete profile after Google login:', profileError);
        // Continue even if profile fetch fails
      }
      
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
    console.log('🚪 Logging out user...');
    set({ isLoading: true });
    try {
      // Clear all auth data
      console.log('🧹 Clearing authentication data...');
      await get().clearAuthData();
      console.log('✅ Authentication data cleared');
    } catch (error) {
      console.error('❌ Error clearing authentication data:', error);
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
      console.log('✅ Logout completed successfully');
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

  saveUserData: async (data, step) => {
    console.log('💾 Saving user data:', data, 'step:', step);
    const { user } = get();
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Update the user profile with new data
      const updatedUser = await authAPI.updateProfile(data);
      console.log('✅ User data saved successfully:', updatedUser);
      
      // Update local state
      set({ user: updatedUser });
    } catch (error: any) {
      console.error('❌ Error saving user data:', error);
      throw error;
    }
  },

  fetchProfile: async () => {
    try {
      console.log('🔄 Fetching user profile...');
      const profileData = await authAPI.getProfile();
      console.log('📥 Profile data received:', profileData);
      
      const transformedUser: UserProfile = {
        id: profileData.id.toString(),
        email: profileData.email,
        name: profileData.first_name || profileData.name || '',
        height: profileData.height,
        weight: profileData.weight,
        gender: profileData.gender,
        fitnessGoal: profileData.fitness_goal,
        specificGoal: profileData.specific_goal,
        hasCompletedOnboarding: profileData.has_completed_onboarding || false,
      };
      
      console.log('📤 Transformed user data:', transformedUser);
      set({ user: transformedUser });
      console.log('✅ Profile fetched and stored successfully');
    } catch (error: any) {
      console.error('❌ Profile fetch error:', error);
      throw error;
    }
  },

  fetchCompleteProfile: async () => {
    try {
      const profileData = await authAPI.getCompleteProfile();
      
      const transformedUser: UserProfile = {
        id: profileData.id.toString(),
        email: profileData.email,
        name: profileData.first_name || profileData.name || '',
        height: profileData.height,
        weight: profileData.weight,
        gender: profileData.gender,
        fitnessGoal: profileData.fitness_goal,
        specificGoal: profileData.specific_goal,
        hasCompletedOnboarding: profileData.has_completed_onboarding || false,
      };
      
      set({ user: transformedUser });
    } catch (error: any) {
      console.error('Complete profile fetch error:', error);
      throw error;
    }
  },

  completeOnboarding: async () => {
    try {
      console.log('🔄 Calling API to complete onboarding...');
      // Call the backend API to mark onboarding as complete
      const response = await authAPI.completeOnboarding({});
      console.log('✅ Onboarding completed successfully:', response);
      
      // Update the user in the store with completed onboarding flag
      if (response.user) {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              hasCompletedOnboarding: true
            },
            isInOnboarding: false
          });
        }
      } else {
        // Just update the onboarding flag in the store
        set({ isInOnboarding: false });
      }
      
      // Fetch complete profile to ensure all user data is available
      try {
        console.log('🔄 Fetching complete profile after completing onboarding...');
        await get().fetchCompleteProfile();
        console.log('✅ Complete profile fetched successfully after completing onboarding');
      } catch (profileError) {
        console.error('⚠️ Error fetching complete profile after completing onboarding:', profileError);
        // Continue even if profile fetch fails
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Still update the local state even if the API call fails
      set({ isInOnboarding: false });
    }
  },

  setInOnboarding: (inOnboarding: boolean) => {
    set({ isInOnboarding: inOnboarding });
  },

  checkAuthState: () => {
    const state = get();
    console.log('🔍 Current authentication state:', {
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      user: state.user ? {
        id: state.user.id,
        email: state.user.email,
        hasCompletedOnboarding: state.user.hasCompletedOnboarding
      } : null,
      accessToken: state.accessToken ? `${state.accessToken.substring(0, 20)}...` : 'None',
      refreshToken: state.refreshToken ? `${state.refreshToken.substring(0, 20)}...` : 'None'
    });
    return state;
  },

  refreshToken: async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      const { refreshToken } = get();
      
      if (!refreshToken || refreshToken === 'None' || refreshToken === 'null') {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshToken);
      console.log('✅ Token refresh successful');
      
      // Update tokens in store and storage
      await get().setTokens(response.access, response.refresh);
      set({ accessToken: response.access, refreshToken: response.refresh });
      
      return response;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  },
}));
