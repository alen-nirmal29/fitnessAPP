import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration for Django Backend
// Use your computer's IP address instead of localhost for React Native
export const API_BASE_URL = 'http://10.80.219.95:8000/api';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register/`,
  LOGIN: `${API_BASE_URL}/auth/login/`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google-login/`,
  TOKEN_REFRESH: `${API_BASE_URL}/auth/token/refresh/`,
  PROFILE: `${API_BASE_URL}/auth/profile/`,
  PROFILE_UPDATE: `${API_BASE_URL}/auth/profile/update/`,
  ONBOARDING_STEP: `${API_BASE_URL}/auth/onboarding/step/`,
  ONBOARDING_COMPLETE: `${API_BASE_URL}/auth/onboarding/complete/`,
  BODY_COMPOSITION: `${API_BASE_URL}/auth/body-composition/`,
  MEASUREMENTS: `${API_BASE_URL}/auth/measurements/`,
  GOAL_MEASUREMENTS: `${API_BASE_URL}/auth/goal-measurements/`,
};

// Workout endpoints
export const WORKOUT_ENDPOINTS = {
  EXERCISES: `${API_BASE_URL}/workouts/exercises/`,
  PLANS: `${API_BASE_URL}/workouts/plans/`,
  DAYS: `${API_BASE_URL}/workouts/days/`,
  SESSIONS: `${API_BASE_URL}/workouts/sessions/`,
  SETS: `${API_BASE_URL}/workouts/sets/`,
};

// Progress endpoints
export const PROGRESS_ENDPOINTS = {
  ENTRIES: `${API_BASE_URL}/progress/entries/`,
  WORKOUT_PROGRESS: `${API_BASE_URL}/progress/workout/`,
  GOALS: `${API_BASE_URL}/progress/goals/`,
  ANALYTICS: `${API_BASE_URL}/progress/analytics/`,
};

// AI endpoints
export const AI_ENDPOINTS = {
  REQUESTS: `${API_BASE_URL}/ai/requests/`,
  RECOMMENDATIONS: `${API_BASE_URL}/ai/recommendations/`,
  TRAINING: `${API_BASE_URL}/ai/training/`,
  MODELS: `${API_BASE_URL}/ai/models/`,
};

// API Headers helper
export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}; 