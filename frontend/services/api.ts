import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ENDPOINTS, WORKOUT_ENDPOINTS, PROGRESS_ENDPOINTS, AI_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// Get authentication headers with proper token retrieval
const getAuthHeaders = async () => {
  try {
    console.log('🔍 Attempting to retrieve access token...');
    const token = await AsyncStorage.getItem('accessToken');
    
    console.log('🔑 Token found:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (!token) {
      console.error('❌ No access token found in AsyncStorage');
      throw new Error('No access token found');
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
    throw new Error('Authentication failed');
  }
};

// Generic API request function with improved token handling
const apiRequest = async (
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  requireAuth: boolean = true
) => {
  let headers: Record<string, string>;
  
  try {
    if (requireAuth) {
      headers = await getAuthHeaders();
    } else {
      headers = { 'Content-Type': 'application/json' };
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw new Error('Authentication required');
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API request failed:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('✅ API request successful:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ API request error:', error);
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
  
  updateProfile: async (data: any) => {
    return apiRequest(AUTH_ENDPOINTS.PROFILE_UPDATE, 'PUT', data);
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