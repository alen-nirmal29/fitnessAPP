import { create } from 'zustand';
import { WorkoutPlan, WorkoutDifficulty, WorkoutDuration } from '@/types/workout';
import { SpecificGoal } from '@/types/user';
import { workoutAPI } from '@/services/api';
import { getPredefinedPlans, getAllPredefinedPlans } from '@/constants/workouts';
import { useAuthStore } from '@/store/auth-store';

// Fallback plan generator for when AI fails
const generateFallbackPlan = (specificGoal: SpecificGoal, duration: string): WorkoutPlan => {
  const goalPlans = {
    build_muscle: {
      name: 'Muscle Building Program',
      description: 'Comprehensive muscle building plan with progressive overload',
      difficulty: 'intermediate' as WorkoutDifficulty,
      schedule: [
        {
          id: 'day-1',
          name: 'Day 1: Chest & Triceps',
          exercises: [
            {
              id: 'ex-1',
              name: 'Bench Press',
              description: 'Lie on bench, lower bar to chest, press up',
              muscleGroup: 'chest',
              sets: 4,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-2',
              name: 'Incline Dumbbell Press',
              description: 'Press dumbbells on incline bench',
              muscleGroup: 'chest',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
            {
              id: 'ex-3',
              name: 'Tricep Dips',
              description: 'Lower body using triceps, push back up',
              muscleGroup: 'arms',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-2',
          name: 'Day 2: Back & Biceps',
          exercises: [
            {
              id: 'ex-4',
              name: 'Pull-ups',
              description: 'Pull body up to bar using back muscles',
              muscleGroup: 'back',
              sets: 4,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-5',
              name: 'Barbell Rows',
              description: 'Row barbell to lower chest',
              muscleGroup: 'back',
              sets: 4,
              reps: 10,
              restTime: 90,
            },
            {
              id: 'ex-6',
              name: 'Bicep Curls',
              description: 'Curl dumbbells using biceps',
              muscleGroup: 'arms',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-3',
          name: 'Day 3: Legs',
          exercises: [
            {
              id: 'ex-7',
              name: 'Squats',
              description: 'Lower body by bending knees, return to standing',
              muscleGroup: 'legs',
              sets: 4,
              reps: 10,
              restTime: 120,
            },
            {
              id: 'ex-8',
              name: 'Deadlifts',
              description: 'Lift barbell from ground to hip level',
              muscleGroup: 'legs',
              sets: 4,
              reps: 8,
              restTime: 180,
            },
            {
              id: 'ex-9',
              name: 'Leg Press',
              description: 'Press weight with legs on machine',
              muscleGroup: 'legs',
              sets: 3,
              reps: 12,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-4',
          name: 'Day 4: Shoulders',
          exercises: [
            {
              id: 'ex-10',
              name: 'Military Press',
              description: 'Press barbell overhead',
              muscleGroup: 'shoulders',
              sets: 4,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-11',
              name: 'Lateral Raises',
              description: 'Raise dumbbells to sides',
              muscleGroup: 'shoulders',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
            {
              id: 'ex-12',
              name: 'Rear Delt Flyes',
              description: 'Fly dumbbells behind back',
              muscleGroup: 'shoulders',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-5',
          name: 'Day 5: Rest',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-6',
          name: 'Day 6: Full Body',
          exercises: [
            {
              id: 'ex-13',
              name: 'Burpees',
              description: 'Squat, jump, push-up, jump',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 10,
              restTime: 60,
            },
            {
              id: 'ex-14',
              name: 'Mountain Climbers',
              description: 'Alternate knee to chest',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 20,
              restTime: 45,
            },
            {
              id: 'ex-15',
              name: 'Plank',
              description: 'Hold plank position',
              muscleGroup: 'core',
              sets: 3,
              reps: 30,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-7',
          name: 'Day 7: Rest',
          exercises: [],
          restDay: true,
        },
      ],
      duration: duration as WorkoutDuration,
      specificGoal: specificGoal,
    },
    weight_loss: {
      name: 'Weight Loss Program',
      description: 'High-intensity cardio and strength training for fat loss',
      difficulty: 'intermediate' as WorkoutDifficulty,
      schedule: [
        {
          id: 'day-1',
          name: 'Day 1: HIIT Cardio',
          exercises: [
            {
              id: 'ex-1',
              name: 'Jumping Jacks',
              description: 'Jump while raising arms and legs',
              muscleGroup: 'cardio',
              sets: 3,
              reps: 30,
              restTime: 30,
            },
            {
              id: 'ex-2',
              name: 'Burpees',
              description: 'Squat, jump, push-up, jump',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 15,
              restTime: 45,
            },
            {
              id: 'ex-3',
              name: 'Mountain Climbers',
              description: 'Alternate knee to chest',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 30,
              restTime: 30,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-2',
          name: 'Day 2: Strength Training',
          exercises: [
            {
              id: 'ex-4',
              name: 'Squats',
              description: 'Lower body by bending knees',
              muscleGroup: 'legs',
              sets: 4,
              reps: 15,
              restTime: 60,
            },
            {
              id: 'ex-5',
              name: 'Push-ups',
              description: 'Lower body to ground, push back up',
              muscleGroup: 'chest',
              sets: 3,
              reps: 12,
              restTime: 45,
            },
            {
              id: 'ex-6',
              name: 'Plank',
              description: 'Hold plank position',
              muscleGroup: 'core',
              sets: 3,
              reps: 45,
              restTime: 30,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-3',
          name: 'Day 3: Cardio',
          exercises: [
            {
              id: 'ex-7',
              name: 'Running',
              description: 'Run at moderate pace',
              muscleGroup: 'cardio',
              sets: 1,
              reps: 30,
              restTime: 0,
            },
            {
              id: 'ex-8',
              name: 'Cycling',
              description: 'Cycle at high intensity',
              muscleGroup: 'cardio',
              sets: 1,
              reps: 20,
              restTime: 0,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-4',
          name: 'Day 4: Rest',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-5',
          name: 'Day 5: Circuit Training',
          exercises: [
            {
              id: 'ex-9',
              name: 'Jump Squats',
              description: 'Squat then jump',
              muscleGroup: 'legs',
              sets: 3,
              reps: 20,
              restTime: 30,
            },
            {
              id: 'ex-10',
              name: 'Push-ups',
              description: 'Lower body to ground, push back up',
              muscleGroup: 'chest',
              sets: 3,
              reps: 15,
              restTime: 30,
            },
            {
              id: 'ex-11',
              name: 'Lunges',
              description: 'Step forward, lower body',
              muscleGroup: 'legs',
              sets: 3,
              reps: 20,
              restTime: 30,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-6',
          name: 'Day 6: Active Recovery',
          exercises: [
            {
              id: 'ex-12',
              name: 'Walking',
              description: 'Walk at moderate pace',
              muscleGroup: 'cardio',
              sets: 1,
              reps: 45,
              restTime: 0,
            },
            {
              id: 'ex-13',
              name: 'Stretching',
              description: 'Stretch all major muscle groups',
              muscleGroup: 'full_body',
              sets: 1,
              reps: 15,
              restTime: 0,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-7',
          name: 'Day 7: Rest',
          exercises: [],
          restDay: true,
        },
      ],
      duration: duration as WorkoutDuration,
      specificGoal: specificGoal,
    },
    increase_strength: {
      name: 'Strength Building Program',
      description: 'Progressive overload focus for maximum strength gains',
      difficulty: 'advanced' as WorkoutDifficulty,
      schedule: [
        {
          id: 'day-1',
          name: 'Day 1: Deadlift Focus',
          exercises: [
            {
              id: 'ex-1',
              name: 'Deadlifts',
              description: 'Lift barbell from ground to hip level',
              muscleGroup: 'legs',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-2',
              name: 'Romanian Deadlifts',
              description: 'Deadlift variation with focus on hamstrings',
              muscleGroup: 'legs',
              sets: 3,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-3',
              name: 'Good Mornings',
              description: 'Bend forward with barbell on shoulders',
              muscleGroup: 'legs',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-2',
          name: 'Day 2: Bench Press Focus',
          exercises: [
            {
              id: 'ex-4',
              name: 'Bench Press',
              description: 'Press barbell from chest',
              muscleGroup: 'chest',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-5',
              name: 'Incline Bench Press',
              description: 'Press on incline bench',
              muscleGroup: 'chest',
              sets: 3,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-6',
              name: 'Dips',
              description: 'Lower body using triceps',
              muscleGroup: 'arms',
              sets: 3,
              reps: 8,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-3',
          name: 'Day 3: Rest',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-4',
          name: 'Day 4: Squat Focus',
          exercises: [
            {
              id: 'ex-7',
              name: 'Squats',
              description: 'Lower body by bending knees',
              muscleGroup: 'legs',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-8',
              name: 'Front Squats',
              description: 'Squat with barbell in front',
              muscleGroup: 'legs',
              sets: 3,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-9',
              name: 'Box Jumps',
              description: 'Jump onto box and back down',
              muscleGroup: 'legs',
              sets: 3,
              reps: 8,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-5',
          name: 'Day 5: Overhead Press Focus',
          exercises: [
            {
              id: 'ex-10',
              name: 'Military Press',
              description: 'Press barbell overhead',
              muscleGroup: 'shoulders',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-11',
              name: 'Push Press',
              description: 'Press with leg drive',
              muscleGroup: 'shoulders',
              sets: 3,
              reps: 8,
              restTime: 120,
            },
            {
              id: 'ex-12',
              name: 'Pull-ups',
              description: 'Pull body up to bar',
              muscleGroup: 'back',
              sets: 3,
              reps: 8,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-6',
          name: 'Day 6: Rest',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-7',
          name: 'Day 7: Active Recovery',
          exercises: [
            {
              id: 'ex-13',
              name: 'Light Cardio',
              description: 'Light jogging or cycling',
              muscleGroup: 'cardio',
              sets: 1,
              reps: 20,
              restTime: 0,
            },
            {
              id: 'ex-14',
              name: 'Mobility Work',
              description: 'Dynamic stretching and mobility',
              muscleGroup: 'full_body',
              sets: 1,
              reps: 15,
              restTime: 0,
            },
          ],
          restDay: false,
        },
      ],
      duration: duration as WorkoutDuration,
      specificGoal: specificGoal,
    },
  };

  return goalPlans[specificGoal] || goalPlans.build_muscle;
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
  generateWorkoutPlan: (specificGoal: SpecificGoal, duration: string, userDetails?: any) => Promise<void>;
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
      console.log('🎯 Specific goal:', specificGoal);
      console.log('⏱️ Duration:', duration);
      console.log('👤 User details:', userDetails);
      
      // Get current user from auth store
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Try to generate plan with AI first
      try {
        // This would be the AI endpoint call
        // const aiPlan = await aiAPI.createRequest({
        //   specificGoal,
        //   duration,
        //   userDetails
        // });
        // set({ currentPlan: aiPlan });
        // return;
      } catch (aiError) {
        console.log('🤖 AI generation failed, using fallback plan');
      }

      // Get user's fitness level for plan selection
      const fitnessLevel = userDetails?.fitnessLevel || user?.fitnessLevel || 'intermediate';
      
      // Get predefined plans for this goal and fitness level
      const predefinedPlans = getPredefinedPlans(specificGoal, fitnessLevel as WorkoutDifficulty);
      
      // Select the best matching plan or generate a fallback
      let selectedPlan;
      if (predefinedPlans.length > 0) {
        // Find a plan that matches the duration, or use the first one
        selectedPlan = predefinedPlans.find(plan => plan.duration === duration) || predefinedPlans[0];
        console.log('📋 Selected predefined plan:', selectedPlan.name);
      } else {
        // Fallback to generated plan
        selectedPlan = generateFallbackPlan(specificGoal, duration);
        console.log('📋 Generated fallback plan:', selectedPlan.name);
      }
      
      // Save plan to database
      try {
        await workoutAPI.createPlan({
          name: selectedPlan.name,
          description: selectedPlan.description,
          difficulty: selectedPlan.difficulty,
          duration: selectedPlan.duration,
          specific_goal: specificGoal,
          is_ai_generated: true, // Mark as AI generated
          ai_prompt_used: JSON.stringify(userDetails), // Store user details as prompt
          created_by: user.id // Use the authenticated user's ID
        });
        console.log('✅ Workout plan saved to database');
      } catch (dbError) {
        console.error('❌ Failed to save plan to database:', dbError);
      }
      
      set({ currentPlan: selectedPlan, isLoading: false });
    } catch (error: any) {
      console.error('❌ Workout plan generation failed:', error);
      set({ error: error.message, isLoading: false });
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
    } catch (error) {
      console.error('❌ Failed to load user plans:', error);
    }
  },

  saveWorkoutProgress: async (progressData) => {
    try {
      console.log('💾 Saving workout progress to database...');
      const result = await workoutAPI.saveProgress(progressData);
      console.log('✅ Workout progress saved:', result);
    } catch (error) {
      console.error('❌ Failed to save workout progress:', error);
      throw error;
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