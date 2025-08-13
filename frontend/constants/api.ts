import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration for Django Backend
// Use your computer's IP address instead of localhost for React Native
export const API_BASE_URL = 'http://192.168.68.106:8000/api';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register/`,
  LOGIN: `${API_BASE_URL}/auth/login/`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google-login/`,
  TOKEN_REFRESH: `${API_BASE_URL}/auth/token/refresh/`,
  PROFILE: `${API_BASE_URL}/auth/profile/`,
  PROFILE_UPDATE: `${API_BASE_URL}/auth/profile/`,
  PROFILE_COMPLETE: `${API_BASE_URL}/auth/profile/complete/`,
  ONBOARDING_STEP: `${API_BASE_URL}/auth/onboarding/step/`,
  ONBOARDING_COMPLETE: `${API_BASE_URL}/auth/onboarding/complete/`,
  BODY_COMPOSITION: `${API_BASE_URL}/auth/body-composition/`,
  MEASUREMENTS: `${API_BASE_URL}/auth/measurements/`,
  GOAL_MEASUREMENTS: `${API_BASE_URL}/auth/goal-measurements/`,
  HEALTH: `${API_BASE_URL}/auth/health/`,
  TEST_TOKEN: `${API_BASE_URL}/auth/test-token/`,
};

// Workout endpoints
export const WORKOUT_ENDPOINTS = {
  EXERCISES: `${API_BASE_URL}/workouts/exercises/`,
  PLANS: `${API_BASE_URL}/workouts/plans/`,
  USER_PLANS: `${API_BASE_URL}/workouts/user-plans/`,
  DAYS: `${API_BASE_URL}/workouts/days/`,
  SESSIONS: `${API_BASE_URL}/workouts/sessions/`,
  SETS: `${API_BASE_URL}/workouts/sets/`,
  STATS: `${API_BASE_URL}/workouts/stats/`,
  PROGRESS: `${API_BASE_URL}/workouts/progress/`,
  HISTORY: `${API_BASE_URL}/workouts/history/`,
};

// Progress endpoints
export const PROGRESS_ENDPOINTS = {
  ENTRIES: `${API_BASE_URL}/progress/entries/`,
  WORKOUT_PROGRESS: `${API_BASE_URL}/progress/workout/`,
  GOALS: `${API_BASE_URL}/progress/goals/`,
  ANALYTICS: `${API_BASE_URL}/progress/analytics/`,
  SAVE_ENTRY: `${API_BASE_URL}/progress/save-entry/`,
  HISTORY: `${API_BASE_URL}/progress/history/`,
  STATS: `${API_BASE_URL}/progress/stats/`,
  SAVE_GOAL: `${API_BASE_URL}/progress/save-goal/`,
  COMPLETED_WORKOUTS: `${API_BASE_URL}/progress/completed-workouts/`,
  SAVE_WORKOUT: `${API_BASE_URL}/progress/save-workout/`,
  WORKOUT_PROGRESS_HISTORY: `${API_BASE_URL}/progress/workout-progress/`,
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