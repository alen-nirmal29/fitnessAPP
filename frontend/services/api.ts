import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ENDPOINTS, WORKOUT_ENDPOINTS, PROGRESS_ENDPOINTS, AI_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// Get authentication headers with proper token retrieval
const getAuthHeaders = async () => {
  try {
    console.log('🔍 Attempting to retrieve access token...');
    let token = await AsyncStorage.getItem('accessToken');
    
    // If token is not found in AsyncStorage, try to get it from auth-store
    if (!token || token === 'null' || token === 'undefined') {
      try {
        // Dynamically import to avoid circular dependencies
        const authStore = require('@/store/auth-store');
        if (authStore && authStore.getState) {
          const authState = authStore.getState();
          token = authState?.accessToken;
          console.log('🔍 Retrieved token from auth store:', token ? 'Found' : 'Not found');
        }
      } catch (storeError) {
        console.warn('⚠️ Could not access auth store:', storeError);
      }
    }
    
    console.log('🔑 Token found:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (!token) {
      console.warn('⚠️ No access token found, proceeding with basic headers');
      // Return basic headers instead of throwing an error
      return { 'Content-Type': 'application/json' };
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    console.log('✅ Auth headers created successfully');
    console.log('📤 Headers being sent:', { ...headers, Authorization: 'Bearer [HIDDEN]' });
    return headers;
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
    // Return basic headers instead of throwing an error
    return { 'Content-Type': 'application/json' };
  }
};

// Token refresh function
const refreshAccessToken = async () => {
  try {
    console.log('🔄 Attempting to refresh access token...');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!refreshToken || refreshToken === 'None' || refreshToken === 'null' || typeof refreshToken !== 'string') {
      console.error('❌ No valid refresh token found');
      throw new Error('No refresh token available');
    }
    
    console.log('🔑 Using refresh token (first 20 chars):', refreshToken.substring(0, Math.min(20, refreshToken.length)) + '...');
    const response = await fetch(AUTH_ENDPOINTS.TOKEN_REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      console.error('❌ Token refresh failed:', response.status);
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    console.log('✅ Token refresh successful');
    
    // Store the new access token and refresh token
    await AsyncStorage.setItem('accessToken', data.access);
    if (data.refresh) {
      await AsyncStorage.setItem('refreshToken', data.refresh);
      console.log('💾 New refresh token stored');
    }
    console.log('💾 New access token stored');
    
    return data.access;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    throw error;
  }
};

// Generic API request function with token refresh
const apiRequest = async (
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  requireAuth: boolean = true
) => {
  let headers: Record<string, string>;
  
  // Get headers without throwing errors
  if (requireAuth) {
    headers = await getAuthHeaders();
  } else {
    headers = { 'Content-Type': 'application/json' };
  }
  
  const config: RequestInit = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) }),
  };

  try {
    console.log(`🌐 Making ${method} request to:`, url);
    console.log('📦 Request config:', { 
      method, 
      headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : undefined }, 
      body: data 
    });
    
    const response = await fetch(url, config);
    
    console.log('📥 Response status:', response.status);
    
    if (response.status === 401) {
      console.log('🔄 Access token expired, attempting refresh...');
      try {
        const newAccessToken = await refreshAccessToken();
        // Retry the request with new token
        headers.Authorization = `Bearer ${newAccessToken}`;
        const retryConfig = { ...config, headers };
        const retryResponse = await fetch(url, retryConfig);
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          console.error('❌ Retry request failed:', errorData);
          
          // For workout and progress endpoints, return empty data instead of throwing
          if (url.includes('/workouts/') || url.includes('/progress/')) {
            console.warn('⚠️ Returning empty data for workout/progress endpoint after failed retry');
            return url.includes('history') || url.includes('completed-workouts') ? { results: [] } : {};
          }
          
          throw new Error(errorData.error || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }
        
        const responseData = await retryResponse.json();
        console.log('✅ Retry request successful:', responseData);
        return responseData;
      } catch (refreshError) {
        console.error('❌ Token refresh failed, clearing auth data...');
        // Clear auth data and throw error
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // For workout and progress endpoints, return empty data instead of throwing
        if (url.includes('/workouts/') || url.includes('/progress/')) {
          console.warn('⚠️ Returning empty data for workout/progress endpoint after refresh failure');
          return url.includes('history') || url.includes('completed-workouts') ? { results: [] } : {};
        }
        
        throw new Error('Authentication expired. Please login again.');
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API request failed:', errorData);
      
      // For workout and progress endpoints, return empty data instead of throwing
      if (url.includes('/workouts/') || url.includes('/progress/')) {
        console.warn('⚠️ Returning empty data for workout/progress endpoint after failed request');
        return url.includes('history') || url.includes('completed-workouts') ? { results: [] } : {};
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('✅ API request successful:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ API request error:', error);
    
    // For workout and progress endpoints, return empty data instead of throwing
    if (url.includes('/workouts/') || url.includes('/progress/')) {
      console.warn('⚠️ Returning empty data for workout/progress endpoint after error');
      return url.includes('history') || url.includes('completed-workouts') ? { results: [] } : {};
    }
    
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  register: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.REGISTER, 'POST', data, false);
  },
  
  login: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.LOGIN, 'POST', data, false);
  },
  
  googleLogin: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.GOOGLE_LOGIN, 'POST', data, false);
  },
  
  getProfile: async () => {
    return apiRequest(AUTH_ENDPOINTS.PROFILE, 'GET');
  },
  
  getCompleteProfile: async () => {
    return apiRequest(AUTH_ENDPOINTS.PROFILE_COMPLETE, 'GET');
  },
  
  updateProfile: async (profile: any) => {
    // Convert camelCase keys to snake_case keys before sending to backend
    const payload = { 
      ...(profile.name !== undefined ? { first_name: profile.name } : {}), 
      ...(profile.gender !== undefined ? { gender: profile.gender } : {}), 
      ...(profile.height !== undefined ? { height: profile.height } : {}), 
      ...(profile.weight !== undefined ? { weight: profile.weight } : {}), 
      ...(profile.fitnessGoal !== undefined ? { fitness_goal: profile.fitnessGoal } : {}), 
      ...(profile.specificGoal !== undefined ? { specific_goal: profile.specificGoal } : {}), 
      ...(profile.hasCompletedOnboarding !== undefined 
        ? { has_completed_onboarding: profile.hasCompletedOnboarding } 
        : {}), 
    };
    return apiRequest(AUTH_ENDPOINTS.PROFILE_UPDATE, 'PUT', payload);
  },
  
  updateOnboardingStep: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.ONBOARDING_STEP, 'POST', data);
  },
  
  completeOnboarding: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.ONBOARDING_COMPLETE, 'POST', data);
  },
  
  updateBodyComposition: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.BODY_COMPOSITION, 'POST', data);
  },
  
  updateMeasurements: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.MEASUREMENTS, 'POST', data);
  },
  
  updateGoalMeasurements: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.GOAL_MEASUREMENTS, 'POST', data);
  },
  
  healthCheck: async () => {
    return apiRequest(AUTH_ENDPOINTS.HEALTH, 'GET', undefined, false);
  },

  refreshToken: async (refreshToken: string) => {
    try {
      console.log('🔄 Attempting to refresh token...');
      
      if (!refreshToken || refreshToken === 'None' || refreshToken === 'null' || typeof refreshToken !== 'string') {
        console.error('❌ No valid refresh token provided to authAPI.refreshToken');
        throw new Error('No refresh token available');
      }
      
      console.log('🔑 Using refresh token (first 20 chars):', refreshToken.substring(0, Math.min(20, refreshToken.length)) + '...');
      const response = await fetch(AUTH_ENDPOINTS.TOKEN_REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status);
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      console.log('✅ Token refresh successful');
      
      return data;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  },
};

// Workout API functions
export const workoutAPI = {
  // Get user's workout plans
  getUserPlans: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.USER_PLANS, 'GET');
  },
  
  // Create new workout plan
  createPlan: async (data: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.PLANS, 'POST', data);
  },
  
  // Get workout statistics
  getStats: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.STATS, 'GET');
  },
  
  // Save workout progress
  saveProgress: async (data: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.PROGRESS, 'POST', data);
  },
  
  // Get workout history
  getHistory: async (page: number = 1, pageSize: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return apiRequest(`${WORKOUT_ENDPOINTS.HISTORY}?${params}`, 'GET');
  },
  
  // Create workout session
  createSession: async (data: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.SESSIONS, 'POST', data);
  },
  
  // Update workout session
  updateSession: async (sessionId: number, data: any) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SESSIONS}${sessionId}/`, 'PUT', data);
  },
  
  // Create exercise set
  createExerciseSet: async (data: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.SETS, 'POST', data);
  },
};

// Progress API functions
export const progressAPI = {
  // Save progress entry
  saveEntry: async (data: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.SAVE_ENTRY, 'POST', data);
  },
  
  // Get progress history
  getHistory: async (page: number = 1, pageSize: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return apiRequest(`${PROGRESS_ENDPOINTS.HISTORY}?${params}`, 'GET');
  },
  
  // Get progress statistics
  getStats: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.STATS, 'GET');
  },

  // Save completed workout
  saveCompletedWorkout: async (data: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.SAVE_WORKOUT, 'POST', data);
  },

  // Get completed workouts
  getCompletedWorkouts: async (page: number = 1, pageSize: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return apiRequest(`${PROGRESS_ENDPOINTS.WORKOUT_PROGRESS_HISTORY}?${params}`, 'GET');
  },

  // Get all completed workouts (no pagination)
  getAllCompletedWorkouts: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.COMPLETED_WORKOUTS, 'GET');
  },
  
  // Save goal
  saveGoal: async (data: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.SAVE_GOAL, 'POST', data);
  },
  
  // Get goals
  getGoals: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.GOALS, 'GET');
  },
  
  // Create progress entry (legacy endpoint)
  createEntry: async (data: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.ENTRIES, 'POST', data);
  },
};

// AI API functions
export const aiAPI = {
  createRequest: async (data: any) => {
    return apiRequest(AI_ENDPOINTS.REQUESTS, 'POST', data);
  },
  
  getRecommendations: async () => {
    return apiRequest(AI_ENDPOINTS.RECOMMENDATIONS, 'GET');
  },
  
  getTraining: async () => {
    return apiRequest(AI_ENDPOINTS.TRAINING, 'GET');
  },
  
  getModels: async () => {
    return apiRequest(AI_ENDPOINTS.MODELS, 'GET');
  },
};

// Export the main API service
export const apiService = {
  auth: authAPI,
  workout: workoutAPI,
  progress: progressAPI,
  ai: aiAPI,
};