import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { workoutAPI } from '@/services/api';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutDifficulty, WorkoutDuration } from '@/types/workout';
import { getPredefinedPlans } from '@/constants/workouts';
import { SpecificGoal } from '@/types/user';
import { UserProfile } from '@/types/user';
import { useAuthStore } from '@/store/auth-store';

// Helper function to create a workout plan with common properties
const createWorkoutPlan = (planId: string, specificGoal: SpecificGoal, duration: WorkoutDuration) => 
  (name: string, description: string, difficulty: WorkoutDifficulty, schedule: any[]): WorkoutPlan => ({
    id: planId,
    name,
    description,
    difficulty,
    schedule,
    duration,
    specificGoal,
    isAIGenerated: false
  });

// Base exercise template
const createExercise = (id: string, name: string, description: string, muscleGroup: string, sets: number, reps: number, restTime: number) => ({
  id,
  name,
  description,
  muscleGroup,
  sets,
  reps,
  restTime
});

// Base day template
const createDay = (id: string, name: string, exercises: any[], restDay = false) => ({
  id,
  name,
  exercises,
  restDay
});

// Basic exercise type that matches one of the Exercise union variants
type BasicExercise = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  sets: number;
  restTime: number;
} & (
  | { reps: number; duration?: never; }
  | { duration: number; reps?: never; }
  | { reps: number; duration: number; }
);

// Basic exercises that will be used in the fallback plan
const BASIC_EXERCISES: BasicExercise[] = [
  // Upper body
  { id: 'ex-1', name: 'Push-ups', description: 'Basic push-up exercise', muscleGroup: 'chest', sets: 3, reps: 12, restTime: 45 },
  { id: 'ex-2', name: 'Dumbbell Rows', description: 'Bend over and row dumbbells', muscleGroup: 'back', sets: 3, reps: 12, restTime: 45 },
  { id: 'ex-3', name: 'Shoulder Press', description: 'Press dumbbells overhead', muscleGroup: 'shoulders', sets: 3, reps: 12, restTime: 45 },
  { id: 'ex-4', name: 'Bicep Curls', description: 'Curl dumbbells', muscleGroup: 'biceps', sets: 3, reps: 12, restTime: 30 },
  { id: 'ex-5', name: 'Tricep Dips', description: 'Use a bench or chair', muscleGroup: 'triceps', sets: 3, reps: 12, restTime: 30 },
  
  // Lower body
  { id: 'ex-6', name: 'Bodyweight Squats', description: 'Basic squat exercise', muscleGroup: 'legs', sets: 3, reps: 15, restTime: 45 },
  { id: 'ex-7', name: 'Lunges', description: 'Alternating leg lunges', muscleGroup: 'legs', sets: 3, reps: 12, restTime: 45 },
  { id: 'ex-8', name: 'Glute Bridges', description: 'Lift hips up and squeeze glutes', muscleGroup: 'glutes', sets: 3, reps: 15, restTime: 30 },
  { id: 'ex-9', name: 'Calf Raises', description: 'Raise up on toes', muscleGroup: 'calves', sets: 3, reps: 20, restTime: 30 },
  
  // Core
  { id: 'ex-10', name: 'Plank', description: 'Hold plank position', muscleGroup: 'core', sets: 3, duration: 30, restTime: 30 },
  { id: 'ex-11', name: 'Bicycle Crunches', description: 'Alternate elbow to knee', muscleGroup: 'core', sets: 3, reps: 20, restTime: 30 },
  { id: 'ex-12', name: 'Russian Twists', description: 'Twist side to side', muscleGroup: 'obliques', sets: 3, reps: 20, restTime: 30 },
  
  // Cardio
  { id: 'ex-13', name: 'Jump Rope', description: '3 minutes of jumping', muscleGroup: 'cardio', sets: 3, duration: 180, restTime: 60 },
  { id: 'ex-14', name: 'Jogging', description: '20 minutes', muscleGroup: 'cardio', sets: 1, duration: 1200, restTime: 0 },
  { id: 'ex-15', name: 'Mountain Climbers', description: 'Fast feet', muscleGroup: 'core/cardio', sets: 3, reps: 30, restTime: 30 }
];

// Helper function to convert BasicExercise to Exercise
const toExercise = (ex: BasicExercise): Exercise => {
  // TypeScript can now properly infer the correct type
  return {
    id: ex.id,
    name: ex.name,
    description: ex.description,
    muscleGroup: ex.muscleGroup,
    sets: ex.sets,
    restTime: ex.restTime,
    ...(ex.reps !== undefined && { reps: ex.reps }),
    ...(ex.duration !== undefined && { duration: ex.duration })
  } as Exercise;
};

const generateFallbackPlan = (specificGoal: SpecificGoal = 'build_muscle', duration: string = '1_month'): WorkoutPlan => {
  try {
    console.log('🔄 Generating fallback plan for:', { specificGoal, duration });
    
    // Create a new plan ID with timestamp
    const planId = `fallback-${Date.now()}`;
    const fitnessLevel = 'intermediate';
    
    // Helper function to get exercises by muscle group
    const getExercisesByGroup = (groups: string[], count: number = 4): Exercise[] => {
      return BASIC_EXERCISES
        .filter(ex => groups.some(group => ex.muscleGroup.includes(group)))
        .slice(0, count)
        .map(ex => toExercise(ex));
    };
    
    // Create the fallback plan with a 7-day schedule
    const fallbackPlan: WorkoutPlan = {
      id: planId,
      name: `Basic ${specificGoal.split('_').join(' ').toUpperCase()} Plan`,
      description: `A complete workout plan for ${specificGoal.split('_').join(' ')} with basic exercises`,
      difficulty: fitnessLevel as WorkoutDifficulty,
      duration: duration as WorkoutDuration,
      specificGoal: specificGoal,
      isAIGenerated: false,
      exercises: [...BASIC_EXERCISES], // Include all basic exercises
      schedule: [
        // Day 1: Upper Body
        createDay('day-1', 'Day 1: Upper Body', getExercisesByGroup(['chest', 'back', 'shoulders', 'biceps', 'triceps'], 5)),
        
        // Day 2: Lower Body
        createDay('day-2', 'Day 2: Lower Body', getExercisesByGroup(['legs', 'glutes', 'calves'], 4)),
        
        // Day 3: Core & Cardio
        createDay('day-3', 'Day 3: Core & Cardio', [
          ...getExercisesByGroup(['core', 'obliques'], 3),
          ...getExercisesByGroup(['cardio'], 1)
        ]),
        
        // Day 4: Active Recovery
        createDay('day-4', 'Day 4: Active Recovery', [
          toExercise({
            ...(BASIC_EXERCISES.find(ex => ex.id === 'ex-14')!), // Walking
            sets: 1
          }),
          toExercise({
            ...(BASIC_EXERCISES.find(ex => ex.id === 'ex-10')!), // Plank
            sets: 2,
            duration: 20
          })
        ], true),
        
        // Day 5: Full Body
        createDay('day-5', 'Day 5: Full Body', [
          ...getExercisesByGroup(['chest', 'back', 'legs'], 1),
          ...getExercisesByGroup(['core'], 1),
          ...getExercisesByGroup(['shoulders', 'biceps', 'triceps'], 1)
        ]),
        
        // Day 6: Cardio & Core
        createDay('day-6', 'Day 6: Cardio & Core', [
          ...getExercisesByGroup(['cardio'], 2),
          ...getExercisesByGroup(['core'], 2)
        ]),
        
        // Day 7: Rest Day
        createDay('day-7', 'Day 7: Rest Day', [], true)
      ]
    };
    
    console.log('✅ Generated fallback plan with', fallbackPlan.schedule.length, 'days');
    return fallbackPlan;
    
  } catch (error) {
    console.error('❌ Error generating fallback plan:', error);
    
    // Return a minimal valid plan if something goes wrong
    return {
      id: `minimal-${Date.now()}`,
      name: 'Basic Workout Plan',
      description: 'A simple workout plan to get you started',
      difficulty: 'beginner',
      duration: '1_month',
      specificGoal: 'build_muscle',
      isAIGenerated: false,
      exercises: BASIC_EXERCISES.slice(0, 5),
      schedule: [
        createDay('day-1', 'Full Body Workout', BASIC_EXERCISES.slice(0, 5)),
        createDay('day-2', 'Rest Day', [], true),
        createDay('day-3', 'Full Body Workout', BASIC_EXERCISES.slice(5, 10)),
        createDay('day-4', 'Rest Day', [], true),
        createDay('day-5', 'Full Body Workout', BASIC_EXERCISES.slice(10, 15)),
        createDay('day-6', 'Active Recovery', [BASIC_EXERCISES[13]], true), // Walking
        createDay('day-7', 'Rest Day', [], true)
      ]
    };
  }
};

interface WorkoutStore {
  currentPlan: WorkoutPlan | null;
  recommendedPlans: WorkoutPlan[];
  isLoading: boolean;
  error: string | null;
  completedWorkouts: string[]; // Array of completed workout IDs
  workoutProgress: Record<string, number>; // Progress percentage for each workout plan
  progressMeasurements: Record<string, number> | null; // Post-workout measurements
  
  setCurrentPlan: (plan: WorkoutPlan) => void;
  generateWorkoutPlan: (specificGoal: SpecificGoal, duration: string, userDetails?: any) => Promise<WorkoutPlan>;
  getRecommendedPlans: (specificGoal: SpecificGoal, userDetails?: any) => Promise<void>;
  completeWorkout: (workoutId: string) => void;
  updateWorkoutProgress: (planId: string, progress: number) => void;
  generateProgressMeasurements: (originalMeasurements: Record<string, number>, goal: SpecificGoal, progress: number) => void;
  loadUserPlans: () => Promise<void>;
  saveWorkoutProgress: (progressData: any) => Promise<void>;
  getWorkoutStats: () => Promise<any>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentPlan: null,
  recommendedPlans: [],
  isLoading: false,
  error: null,
  completedWorkouts: [],
  workoutProgress: {},
  progressMeasurements: null,

  setCurrentPlan: (plan) => {
    console.log('📋 Setting current plan:', plan);
    console.log('📋 Plan name:', plan?.name);
    console.log('📋 Plan type:', typeof plan);
    set({ currentPlan: plan });
  },

  generateWorkoutPlan: async (specificGoal, duration, userDetails) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🏋️ Generating workout plan...');
      
      // Get current user from auth store
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Set a default specificGoal if none provided
      if (!specificGoal) {
        specificGoal = user?.specificGoal || 'build_muscle';
        console.warn('⚠️ No specific goal provided, using:', specificGoal);
      }
      
      console.log('🎯 Using specific goal:', specificGoal);
      console.log('⏱️ Duration:', duration);
      console.log('👤 User details:', userDetails);

      let selectedPlan: WorkoutPlan;
      
      try {
        // First try to get predefined plans
        const fitnessLevel = userDetails?.fitnessLevel || 'intermediate';
        console.log('🔍 Looking for plans with:', { goal: specificGoal, level: fitnessLevel });
        
        const predefinedPlans = getPredefinedPlans(specificGoal, fitnessLevel as WorkoutDifficulty);
        console.log('📋 Found predefined plans:', predefinedPlans?.length || 0);
        
        if (predefinedPlans?.length > 0) {
          // Try to find a plan matching the duration, or take the first one
          selectedPlan = predefinedPlans.find(plan => plan.duration === duration) || predefinedPlans[0];
          console.log('✅ Selected predefined plan:', selectedPlan.name);
        } else {
          // If no predefined plans, generate a fallback
          console.log('ℹ️ No predefined plans found, generating fallback plan');
          selectedPlan = generateFallbackPlan(specificGoal, duration);
        }
      } catch (error) {
        console.error('❌ Error getting predefined plans, using fallback:', error);
        selectedPlan = generateFallbackPlan(specificGoal, duration);
      }
      
      // Ensure we have a valid plan
      if (!selectedPlan) {
        console.error('❌ Failed to generate workout plan, using empty fallback');
        selectedPlan = generateFallbackPlan('build_muscle', duration || '1_month');
      }
      
      // Add required fields if missing
      const finalPlan: WorkoutPlan = {
        id: selectedPlan.id || `plan-${Date.now()}`,
        name: selectedPlan.name || `Custom ${specificGoal.split('_').join(' ')} Plan`,
        description: selectedPlan.description || `A workout plan for ${specificGoal.split('_').join(' ')}`,
        difficulty: selectedPlan.difficulty || 'intermediate',
        duration: (duration as WorkoutDuration) || '1_month',
        specificGoal: specificGoal as SpecificGoal,
        schedule: Array.isArray(selectedPlan.schedule) ? selectedPlan.schedule : [],
        isAIGenerated: false,
        exercises: selectedPlan.exercises || []
      };
      
      // Validate schedule
      if (!Array.isArray(finalPlan.schedule)) {
        console.warn('⚠️ Invalid schedule format, initializing empty schedule');
        finalPlan.schedule = [];
      }
      
      console.log('📋 Final plan details:', {
        id: finalPlan.id,
        name: finalPlan.name,
        scheduleLength: finalPlan.schedule?.length,
        exercises: finalPlan.exercises?.length
      });
      
      // Save the plan to the backend if we have a user
      if (user?.id) {
        try {
          await workoutAPI.createPlan({
            name: finalPlan.name,
            description: finalPlan.description,
            difficulty: finalPlan.difficulty,
            duration: finalPlan.duration,
            specific_goal: specificGoal,
            is_ai_generated: false,
            created_by: user.id,
            schedule: finalPlan.schedule || []
          });
          console.log('✅ Workout plan saved to database');
        } catch (dbError) {
          console.error('❌ Failed to save plan to database, continuing with local plan:', dbError);
          // Continue with local plan even if saving fails
        }
      }
      
      // Update the store with the new plan
      set({ 
        currentPlan: selectedPlan, 
        isLoading: false 
      });
      console.log('🔄 Current plan updated in store');
      
      return selectedPlan;
      
    } catch (error: any) {
      console.error('❌ Workout plan generation failed:', error);
      set({ 
        error: error.message || 'Failed to generate workout plan', 
        isLoading: false 
      });
      throw error; // Re-throw to allow error handling in the component
    }
  },

  getRecommendedPlans: async (specificGoal, userDetails) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Getting recommended plans...');
      console.log('🎯 Specific goal:', specificGoal);
      console.log('👤 User details:', userDetails);
      
      // Get user's fitness level from user details
      const fitnessLevel = userDetails?.fitnessLevel || 'intermediate';
      console.log('🎯 User fitness level:', fitnessLevel);
      
      // Get predefined plans based on goal and fitness level
      let predefinedPlans: WorkoutPlan[] = [];
      try {
        predefinedPlans = getPredefinedPlans(specificGoal, fitnessLevel as WorkoutDifficulty);
        console.log('📊 Predefined plans found:', predefinedPlans.length);
      } catch (predefinedError) {
        console.error('❌ Error getting predefined plans:', predefinedError);
        predefinedPlans = [];
      }
      
      // Also get user's custom plans from database
      let userPlans: WorkoutPlan[] = [];
      try {
        const dbPlans = await workoutAPI.getUserPlans();
        userPlans = dbPlans || [];
        console.log('📊 User plans from database:', userPlans.length);
      } catch (dbError) {
        console.log('⚠️ Could not fetch user plans from database:', dbError);
        userPlans = [];
      }
      
      // Combine predefined and user plans
      const allPlans = [
        ...(Array.isArray(predefinedPlans) ? predefinedPlans : []),
        ...(Array.isArray(userPlans) ? userPlans : [])
      ];
      console.log('📋 Total recommended plans:', allPlans.length);
      
      set({ recommendedPlans: allPlans, isLoading: false });
    } catch (error: any) {
      console.error('❌ Failed to get recommended plans:', error);
      console.error('❌ Error details:', error.stack);
      set({ error: error.message, isLoading: false });
    }
  },

  completeWorkout: (workoutId) => {
    const { completedWorkouts } = get();
    if (!completedWorkouts.includes(workoutId)) {
      set({ completedWorkouts: [...completedWorkouts, workoutId] });
    }
  },

  updateWorkoutProgress: (planId, progress) => {
    const { workoutProgress } = get();
    set({ workoutProgress: { ...workoutProgress, [planId]: progress } });
  },

  generateProgressMeasurements: (originalMeasurements, goal, progress) => {
    const progressFactor = progress / 100;
    const newMeasurements: Record<string, number> = {};

    Object.entries(originalMeasurements).forEach(([key, value]) => {
      let change = 0;
      switch (goal) {
        case 'build_muscle':
          change = value * 0.05 * progressFactor; // 5% increase
          break;
        case 'weight_loss':
          change = -value * 0.03 * progressFactor; // 3% decrease
          break;
        case 'increase_strength':
          change = value * 0.02 * progressFactor; // 2% increase
          break;
        default:
          change = 0;
      }
      newMeasurements[key] = Math.max(0, value + change);
    });

    set({ progressMeasurements: newMeasurements });
  },

  loadUserPlans: async () => {
    try {
      console.log('📋 Loading user plans from database...');
      const userPlans = await workoutAPI.getUserPlans();
      console.log('✅ User plans loaded:', userPlans);
      
      if (userPlans.length > 0) {
        set({ currentPlan: userPlans[0] });
      }
    } catch (error: any) {
      console.error('❌ Failed to load user plans:', error);
    }
  },

  saveWorkoutProgress: async (progressData: { planId: string; progressPercentage: number }) => {
    try {
      set({ isLoading: true });
      
      // In a real app, this would be an API call to save progress
      // await workoutAPI.saveProgress({
      //   planId: progressData.planId,
      //   progressPercentage: progressData.progressPercentage,
      //   completedAt: new Date().toISOString()
      // });
      
      // For now, just update local state
      set(state => ({
        workoutProgress: {
          ...state.workoutProgress,
          [progressData.planId]: progressData.progressPercentage
        }
      }));
      
      console.log(`💾 Saved progress for plan ${progressData.planId}: ${progressData.progressPercentage}%`);
    } catch (error: any) {
      console.error('Error saving workout progress:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getWorkoutStats: async () => {
    try {
      console.log('📊 Getting workout statistics...');
      const stats = await workoutAPI.getStats();
      console.log('✅ Workout stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get workout stats:', error);
      throw error;
    }
  },
}));