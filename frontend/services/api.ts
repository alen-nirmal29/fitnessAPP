import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ENDPOINTS, WORKOUT_ENDPOINTS, PROGRESS_ENDPOINTS, AI_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// Get authentication headers with proper token retrieval
const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
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
    throw new Error('Authentication required');
  }
  
  const config: RequestInit = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) }),
  };

  try {
    console.log(`🌐 Making ${method} request to:`, url);
    console.log('📦 Request config:', { method, headers, body: data });
    
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', responseData);

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && requireAuth) {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(AUTH_ENDPOINTS.TOKEN_REFRESH, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              await AsyncStorage.setItem('accessToken', refreshData.access);
              
              // Retry the original request with new token
              const newHeaders = await getAuthHeaders();
              const retryResponse = await fetch(url, {
                ...config,
                headers: newHeaders,
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                return retryData;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear tokens and redirect to login
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            throw new Error('Authentication expired. Please login again.');
          }
        }
      }
      
      throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);
    }

    return responseData;
  } catch (error: any) {
    console.error(`API ${method} request failed:`, error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Test connection
  testConnection: async () => {
    console.log('🧪 Testing backend connection...');
    return apiRequest(`${API_BASE_URL}/auth/test/`, 'GET', undefined, false);
  },

  // Registration
  register: async (userData: { email: string; password: string; confirm_password: string; username: string; first_name: string; last_name: string }) => {
    return apiRequest(AUTH_ENDPOINTS.REGISTER, 'POST', userData, false);
  },

  // Login
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest(AUTH_ENDPOINTS.LOGIN, 'POST', credentials, false);
  },

  // Google Login
  googleLogin: async (idToken: string) => {
    console.log('🌐 Making Google login API request to:', AUTH_ENDPOINTS.GOOGLE_LOGIN);
    console.log('🔑 ID token (first 20 chars):', idToken.substring(0, 20) + '...');
    console.log('📦 Request payload:', { id_token: idToken.substring(0, 20) + '...' });
    return apiRequest(AUTH_ENDPOINTS.GOOGLE_LOGIN, 'POST', { id_token: idToken }, false);
  },

  // Get Profile
  getProfile: async () => {
    return apiRequest(AUTH_ENDPOINTS.PROFILE, 'GET');
  },

  // Update Profile
  updateProfile: async (profileData: any) => {
    return apiRequest(AUTH_ENDPOINTS.PROFILE_UPDATE, 'PUT', profileData);
  },

  // Onboarding Step
  updateOnboardingStep: async (step: string, data: any) => {
    return apiRequest(AUTH_ENDPOINTS.ONBOARDING_STEP, 'POST', { step, data });
  },

  // Complete Onboarding
  completeOnboarding: async () => {
    return apiRequest(AUTH_ENDPOINTS.ONBOARDING_COMPLETE, 'POST');
  },

  // Body Composition
  updateBodyComposition: async (compositionData: any) => {
    return apiRequest(AUTH_ENDPOINTS.BODY_COMPOSITION, 'POST', compositionData);
  },

  // Body Measurements
  updateBodyMeasurements: async (measurementsData: any) => {
    return apiRequest(AUTH_ENDPOINTS.MEASUREMENTS, 'POST', measurementsData);
  },

  // Goal Measurements
  updateGoalMeasurements: async (goalData: any) => {
    return apiRequest(AUTH_ENDPOINTS.GOAL_MEASUREMENTS, 'POST', goalData);
  },
};

// Workout API functions
export const workoutAPI = {
  // Exercises
  getExercises: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.EXERCISES, 'GET');
  },

  createExercise: async (exerciseData: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.EXERCISES, 'POST', exerciseData);
  },

  getExercise: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.EXERCISES}${id}/`, 'GET');
  },

  updateExercise: async (id: number, exerciseData: any) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.EXERCISES}${id}/`, 'PUT', exerciseData);
  },

  deleteExercise: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.EXERCISES}${id}/`, 'DELETE');
  },

  // Workout Plans
  getWorkoutPlans: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.PLANS, 'GET');
  },

  createWorkoutPlan: async (planData: any) => {
    return apiRequest(WORKOUT_ENDPOINTS.PLANS, 'POST', planData);
  },

  getWorkoutPlan: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.PLANS}${id}/`, 'GET');
  },

  updateWorkoutPlan: async (id: number, planData: any) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.PLANS}${id}/`, 'PUT', planData);
  },

  deleteWorkoutPlan: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.PLANS}${id}/`, 'DELETE');
  },

  // Workout Sessions
  getWorkoutSessions: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.SESSIONS, 'GET');
  },

  createWorkoutSession: async (sessionData: any) => {
    console.log('🏋️ Creating workout session with data:', sessionData);
    return apiRequest(WORKOUT_ENDPOINTS.SESSIONS, 'POST', sessionData);
  },

  getWorkoutSession: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SESSIONS}${id}/`, 'GET');
  },

  updateWorkoutSession: async (id: number, sessionData: any) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SESSIONS}${id}/`, 'PUT', sessionData);
  },

  deleteWorkoutSession: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SESSIONS}${id}/`, 'DELETE');
  },

  // Exercise Sets
  getExerciseSets: async () => {
    return apiRequest(WORKOUT_ENDPOINTS.SETS, 'GET');
  },

  createExerciseSet: async (setData: any) => {
    console.log('💪 Creating exercise set with data:', setData);
    return apiRequest(WORKOUT_ENDPOINTS.SETS, 'POST', setData);
  },

  getExerciseSet: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SETS}${id}/`, 'GET');
  },

  updateExerciseSet: async (id: number, setData: any) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SETS}${id}/`, 'PUT', setData);
  },

  deleteExerciseSet: async (id: number) => {
    return apiRequest(`${WORKOUT_ENDPOINTS.SETS}${id}/`, 'DELETE');
  },
};

// Progress API functions
export const progressAPI = {
  // Progress Entries
  getProgressEntries: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.ENTRIES, 'GET');
  },

  createProgressEntry: async (entryData: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.ENTRIES, 'POST', entryData);
  },

  getProgressEntry: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ENTRIES}${id}/`, 'GET');
  },

  updateProgressEntry: async (id: number, entryData: any) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ENTRIES}${id}/`, 'PUT', entryData);
  },

  deleteProgressEntry: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ENTRIES}${id}/`, 'DELETE');
  },

  // Workout Progress
  getWorkoutProgress: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.WORKOUT_PROGRESS, 'GET');
  },

  createWorkoutProgress: async (progressData: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.WORKOUT_PROGRESS, 'POST', progressData);
  },

  getWorkoutProgressById: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.WORKOUT_PROGRESS}${id}/`, 'GET');
  },

  updateWorkoutProgress: async (id: number, progressData: any) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.WORKOUT_PROGRESS}${id}/`, 'PUT', progressData);
  },

  deleteWorkoutProgress: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.WORKOUT_PROGRESS}${id}/`, 'DELETE');
  },

  // Goals
  getGoals: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.GOALS, 'GET');
  },

  createGoal: async (goalData: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.GOALS, 'POST', goalData);
  },

  getGoal: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.GOALS}${id}/`, 'GET');
  },

  updateGoal: async (id: number, goalData: any) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.GOALS}${id}/`, 'PUT', goalData);
  },

  deleteGoal: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.GOALS}${id}/`, 'DELETE');
  },

  // Analytics
  getAnalytics: async () => {
    return apiRequest(PROGRESS_ENDPOINTS.ANALYTICS, 'GET');
  },

  createAnalytics: async (analyticsData: any) => {
    return apiRequest(PROGRESS_ENDPOINTS.ANALYTICS, 'POST', analyticsData);
  },

  getAnalyticsById: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ANALYTICS}${id}/`, 'GET');
  },

  updateAnalytics: async (id: number, analyticsData: any) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ANALYTICS}${id}/`, 'PUT', analyticsData);
  },

  deleteAnalytics: async (id: number) => {
    return apiRequest(`${PROGRESS_ENDPOINTS.ANALYTICS}${id}/`, 'DELETE');
  },
};

// AI API functions
export const aiAPI = {
  // AI Requests
  getAIRequests: async () => {
    return apiRequest(AI_ENDPOINTS.REQUESTS, 'GET');
  },

  createAIRequest: async (requestData: any) => {
    return apiRequest(AI_ENDPOINTS.REQUESTS, 'POST', requestData);
  },

  getAIRequest: async (id: number) => {
    return apiRequest(`${AI_ENDPOINTS.REQUESTS}${id}/`, 'GET');
  },

  updateAIRequest: async (id: number, requestData: any) => {
    return apiRequest(`${AI_ENDPOINTS.REQUESTS}${id}/`, 'PUT', requestData);
  },

  deleteAIRequest: async (id: number) => {
    return apiRequest(`${AI_ENDPOINTS.REQUESTS}${id}/`, 'DELETE');
  },

  // AI Recommendations
  getAIRecommendations: async () => {
    return apiRequest(AI_ENDPOINTS.RECOMMENDATIONS, 'GET');
  },

  createAIRecommendation: async (recommendationData: any) => {
    return apiRequest(AI_ENDPOINTS.RECOMMENDATIONS, 'POST', recommendationData);
  },

  getAIRecommendation: async (id: number) => {
    return apiRequest(`${AI_ENDPOINTS.RECOMMENDATIONS}${id}/`, 'GET');
  },

  updateAIRecommendation: async (id: number, recommendationData: any) => {
    return apiRequest(`${AI_ENDPOINTS.RECOMMENDATIONS}${id}/`, 'PUT', recommendationData);
  },

  deleteAIRecommendation: async (id: number) => {
    return apiRequest(`${AI_ENDPOINTS.RECOMMENDATIONS}${id}/`, 'DELETE');
  },
};

// Export the main API service
export const apiService = {
  auth: authAPI,
  workout: workoutAPI,
  progress: progressAPI,
  ai: aiAPI,
}; 