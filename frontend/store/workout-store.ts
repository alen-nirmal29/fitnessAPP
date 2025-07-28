import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan, WorkoutDifficulty, WorkoutDuration } from '@/types/workout';
import { SpecificGoal } from '@/types/user';
import { WORKOUT_ENDPOINTS, getAuthHeaders } from '@/constants/api';

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
              restTime: 120,
            },
            {
              id: 'ex-9',
              name: 'Leg Press',
              description: 'Press weight using legs on machine',
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
          name: 'Day 4: Shoulders & Core',
          exercises: [
            {
              id: 'ex-10',
              name: 'Overhead Press',
              description: 'Press dumbbells overhead',
              muscleGroup: 'shoulders',
              sets: 4,
              reps: 10,
              restTime: 90,
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
          id: 'day-5',
          name: 'Day 5: Cardio',
          exercises: [
            {
              id: 'ex-13',
              name: 'Running',
              description: 'Moderate pace cardio',
              muscleGroup: 'cardio',
              sets: 1,
              reps: 30,
              restTime: 0,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-6',
          name: 'Day 6: Active Recovery',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-7',
          name: 'Day 7: Rest',
          exercises: [],
          restDay: true,
        },
      ],
    },
    weight_loss: {
      name: 'Fat Burning Circuit',
      description: 'High-intensity circuit training for maximum calorie burn',
      difficulty: 'intermediate' as WorkoutDifficulty,
      schedule: [
        {
          id: 'day-1',
          name: 'Day 1: HIIT Circuit',
          exercises: [
            {
              id: 'ex-1',
              name: 'Burpees',
              description: 'Full body explosive movement',
              muscleGroup: 'full_body',
              sets: 4,
              reps: 15,
              restTime: 45,
            },
            {
              id: 'ex-2',
              name: 'Mountain Climbers',
              description: 'Alternate bringing knees to chest rapidly',
              muscleGroup: 'core',
              sets: 4,
              reps: 20,
              restTime: 30,
            },
            {
              id: 'ex-3',
              name: 'Jump Squats',
              description: 'Squat down and jump up explosively',
              muscleGroup: 'legs',
              sets: 4,
              reps: 15,
              restTime: 45,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-2',
          name: 'Day 2: Strength Circuit',
          exercises: [
            {
              id: 'ex-4',
              name: 'Push-ups',
              description: 'Lower chest to ground, push back up',
              muscleGroup: 'chest',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
            {
              id: 'ex-5',
              name: 'Lunges',
              description: 'Step forward into lunge position',
              muscleGroup: 'legs',
              sets: 3,
              reps: 12,
              restTime: 60,
            },
            {
              id: 'ex-6',
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
          id: 'day-3',
          name: 'Day 3: Cardio HIIT',
          exercises: [
            {
              id: 'ex-7',
              name: 'High Knees',
              description: 'Bring knees up high rapidly',
              muscleGroup: 'cardio',
              sets: 4,
              reps: 30,
              restTime: 30,
            },
            {
              id: 'ex-8',
              name: 'Jumping Jacks',
              description: 'Jump with arms and legs spread',
              muscleGroup: 'full_body',
              sets: 4,
              reps: 20,
              restTime: 30,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-4',
          name: 'Day 4: Upper Body',
          exercises: [
            {
              id: 'ex-9',
              name: 'Push-ups',
              description: 'Standard push-up movement',
              muscleGroup: 'chest',
              sets: 3,
              reps: 10,
              restTime: 60,
            },
            {
              id: 'ex-10',
              name: 'Pike Push-ups',
              description: 'Push-ups in pike position',
              muscleGroup: 'shoulders',
              sets: 3,
              reps: 8,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-5',
          name: 'Day 5: Active Recovery',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-6',
          name: 'Day 6: Full Body Circuit',
          exercises: [
            {
              id: 'ex-11',
              name: 'Burpees',
              description: 'Full body explosive movement',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 8,
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
    },
    increase_strength: {
      name: 'Strength Training Program',
      description: 'Progressive strength building with compound movements',
      difficulty: 'intermediate' as WorkoutDifficulty,
      schedule: [
        {
          id: 'day-1',
          name: 'Day 1: Upper Body Strength',
          exercises: [
            {
              id: 'ex-1',
              name: 'Bench Press',
              description: 'Heavy compound chest movement',
              muscleGroup: 'chest',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-2',
              name: 'Overhead Press',
              description: 'Press barbell overhead',
              muscleGroup: 'shoulders',
              sets: 4,
              reps: 6,
              restTime: 150,
            },
            {
              id: 'ex-3',
              name: 'Barbell Rows',
              description: 'Row barbell to chest',
              muscleGroup: 'back',
              sets: 4,
              reps: 6,
              restTime: 120,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-2',
          name: 'Day 2: Lower Body Strength',
          exercises: [
            {
              id: 'ex-4',
              name: 'Squats',
              description: 'Heavy compound leg movement',
              muscleGroup: 'legs',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-5',
              name: 'Deadlifts',
              description: 'Lift heavy weight from ground',
              muscleGroup: 'back',
              sets: 4,
              reps: 5,
              restTime: 180,
            },
            {
              id: 'ex-6',
              name: 'Bulgarian Split Squats',
              description: 'Single leg strength exercise',
              muscleGroup: 'legs',
              sets: 3,
              reps: 8,
              restTime: 90,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-3',
          name: 'Day 3: Accessory Work',
          exercises: [
            {
              id: 'ex-7',
              name: 'Dumbbell Flyes',
              description: 'Chest isolation exercise',
              muscleGroup: 'chest',
              sets: 3,
              reps: 12,
              restTime: 90,
            },
            {
              id: 'ex-8',
              name: 'Face Pulls',
              description: 'Rear delt and upper back',
              muscleGroup: 'back',
              sets: 3,
              reps: 15,
              restTime: 60,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-4',
          name: 'Day 4: Conditioning',
          exercises: [
            {
              id: 'ex-9',
              name: 'Farmer\'s Walk',
              description: 'Carry heavy weights',
              muscleGroup: 'full_body',
              sets: 3,
              reps: 50,
              restTime: 120,
            },
          ],
          restDay: false,
        },
        {
          id: 'day-5',
          name: 'Day 5: Active Recovery',
          exercises: [],
          restDay: true,
        },
        {
          id: 'day-6',
          name: 'Day 6: Hypertrophy',
          exercises: [
            {
              id: 'ex-10',
              name: 'Incline Bench Press',
              description: 'Upper chest focus',
              muscleGroup: 'chest',
              sets: 4,
              reps: 8,
              restTime: 120,
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
    },
  };

  const defaultPlan = {
    name: `${specificGoal.replace('_', ' ')} Program`,
    description: `Customized workout plan for ${specificGoal.replace('_', ' ')}`,
    difficulty: 'intermediate' as WorkoutDifficulty,
    schedule: [
      {
        id: 'day-1',
        name: 'Day 1: Full Body',
        exercises: [
          {
            id: 'ex-1',
            name: 'Push-ups',
            description: 'Basic upper body exercise',
            muscleGroup: 'chest',
            sets: 3,
            reps: 10,
            restTime: 60,
          },
          {
            id: 'ex-2',
            name: 'Squats',
            description: 'Basic lower body exercise',
            muscleGroup: 'legs',
            sets: 3,
            reps: 10,
            restTime: 60,
          },
        ],
        restDay: false,
      },
    ],
  };

  const planTemplate = goalPlans[specificGoal as keyof typeof goalPlans] || defaultPlan;

  return {
    id: `fallback-${Date.now()}`,
    name: planTemplate.name,
    description: planTemplate.description,
    difficulty: planTemplate.difficulty,
    duration: duration as WorkoutDuration,
    specificGoal,
    isAIGenerated: false,
    schedule: planTemplate.schedule,
  };
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
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      recommendedPlans: [],
      isLoading: false,
      error: null,
      completedWorkouts: [],
      workoutProgress: {},
      progressMeasurements: null,
      
      setCurrentPlan: (plan: WorkoutPlan) => {
        set({ currentPlan: plan });
      },
      
      generateWorkoutPlan: async (specificGoal: SpecificGoal, duration: string, userDetails?: any) => {
        set({ isLoading: true, error: null });
        try {
          const headers = await getAuthHeaders();
          
          // Create workout plan via Django API
          const response = await fetch(WORKOUT_ENDPOINTS.PLANS, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: `${specificGoal.replace('_', ' ')} Plan`,
              description: `Customized workout plan for ${specificGoal.replace('_', ' ')}`,
              difficulty: 'intermediate',
              duration: duration,
              specific_goal: specificGoal,
              is_ai_generated: true,
              user_details: userDetails || {},
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate workout plan');
          }
          
          const workoutPlanData = await response.json();
          
          // Convert Django response to frontend format
          const workoutPlan: WorkoutPlan = {
            id: workoutPlanData.id.toString(),
            name: workoutPlanData.name,
            description: workoutPlanData.description,
            difficulty: workoutPlanData.difficulty as WorkoutDifficulty,
            duration: workoutPlanData.duration as WorkoutDuration,
            specificGoal: workoutPlanData.specific_goal,
            isAIGenerated: workoutPlanData.is_ai_generated,
            schedule: workoutPlanData.days?.map((day: any, index: number) => ({
              id: day.id.toString(),
              name: day.name,
              exercises: day.exercises?.map((ex: any, exIndex: number) => ({
                id: ex.id.toString(),
                name: ex.exercise.name,
                description: ex.exercise.description,
                muscleGroup: ex.exercise.muscle_group,
                sets: ex.sets,
                reps: ex.reps,
                restTime: ex.rest_time,
              })) || [],
              restDay: day.is_rest_day,
            })) || [],
          };
          
          set({ 
            currentPlan: workoutPlan,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error generating workout plan:', error);
          // Generate fallback plan
          const fallbackPlan = generateFallbackPlan(specificGoal, duration);
          set({
            currentPlan: fallbackPlan,
            isLoading: false,
            error: 'API generation failed, using fallback plan'
          });
        }
      },
      
      getRecommendedPlans: async (specificGoal: SpecificGoal, userDetails?: any) => {
        set({ isLoading: true, error: null });
        try {
          const headers = await getAuthHeaders();
          
          // Get recommended plans from Django API
          const response = await fetch(`${WORKOUT_ENDPOINTS.PLANS}?specific_goal=${specificGoal}`, {
            method: 'GET',
            headers,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get recommendations');
          }
          
          const plansData = await response.json();
          
          // Convert Django response to frontend format
          const recommendedPlans: WorkoutPlan[] = plansData.results?.map((plan: any) => ({
            id: plan.id.toString(),
            name: plan.name,
            description: plan.description,
            difficulty: plan.difficulty as WorkoutDifficulty,
            duration: plan.duration as WorkoutDuration,
            specificGoal: plan.specific_goal,
            isAIGenerated: plan.is_ai_generated,
            schedule: plan.days?.map((day: any, index: number) => ({
              id: day.id.toString(),
              name: day.name,
              exercises: day.exercises?.map((ex: any, exIndex: number) => ({
                id: ex.id.toString(),
                name: ex.exercise.name,
                description: ex.exercise.description,
                muscleGroup: ex.exercise.muscle_group,
                sets: ex.sets,
                reps: ex.reps,
                restTime: ex.rest_time,
              })) || [],
              restDay: day.is_rest_day,
            })) || [],
          })) || [];
          
          // If no plans from API, use fallback plans
          if (recommendedPlans.length === 0) {
            recommendedPlans.push(
              {
                id: 'plan-1',
                name: '30-Day Strength Foundation',
                description: 'Perfect starter plan based on your body composition and goals',
                difficulty: 'beginner' as WorkoutDifficulty,
                duration: '1_month' as WorkoutDuration,
                specificGoal,
                isAIGenerated: false,
                schedule: [
                  {
                    id: 'day-1',
                    name: 'Day 1: Full Body',
                    exercises: [
                      {
                        id: 'ex-1',
                        name: 'Push-ups',
                        description: 'Basic upper body exercise',
                        muscleGroup: 'chest',
                        sets: 3,
                        reps: 10,
                        restTime: 60,
                      },
                      {
                        id: 'ex-2',
                        name: 'Squats',
                        description: 'Basic lower body exercise',
                        muscleGroup: 'legs',
                        sets: 3,
                        reps: 10,
                        restTime: 60,
                      },
                    ],
                    restDay: false,
                  },
                  {
                    id: 'day-2',
                    name: 'Day 2: Rest',
                    exercises: [],
                    restDay: true,
                  },
                ],
              }
            );
          }
          
          set({ 
            recommendedPlans,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error getting recommendations:', error);
          // Provide fallback recommendations
          const fallbackPlans: WorkoutPlan[] = [
            {
              id: 'plan-1',
              name: '30-Day Foundation',
              description: 'Perfect starter plan for your fitness goals',
              difficulty: 'beginner' as WorkoutDifficulty,
              duration: '1_month' as WorkoutDuration,
              specificGoal,
              isAIGenerated: false,
              schedule: [
                {
                  id: 'day-1',
                  name: 'Day 1: Full Body',
                  exercises: [
                    {
                      id: 'ex-1',
                      name: 'Push-ups',
                      description: 'Basic upper body exercise',
                      muscleGroup: 'chest',
                      sets: 3,
                      reps: 10,
                      restTime: 60,
                    },
                    {
                      id: 'ex-2',
                      name: 'Squats',
                      description: 'Basic lower body exercise',
                      muscleGroup: 'legs',
                      sets: 3,
                      reps: 10,
                      restTime: 60,
                    },
                  ],
                  restDay: false,
                },
                {
                  id: 'day-2',
                  name: 'Day 2: Rest',
                  exercises: [],
                  restDay: true,
                },
              ],
            },
          ];
          
          set({
            recommendedPlans: fallbackPlans,
            error: 'API recommendations unavailable, showing default plans',
            isLoading: false,
          });
        }
      },
      
      completeWorkout: (workoutId: string) => {
        const { completedWorkouts } = get();
        if (!completedWorkouts.includes(workoutId)) {
          set({ 
            completedWorkouts: [...completedWorkouts, workoutId] 
          });
        }
      },
      
      updateWorkoutProgress: (planId: string, progress: number) => {
        const { workoutProgress } = get();
        set({ 
          workoutProgress: { 
            ...workoutProgress, 
            [planId]: progress 
          } 
        });
      },
      
      generateProgressMeasurements: (originalMeasurements: Record<string, number>, goal: SpecificGoal, progress: number) => {
        // Calculate progress-based measurements based on goal and completion percentage
        const progressFactor = progress / 100;
        let progressMeasurements: Record<string, number> = {};
        
        // Ensure we have valid original measurements
        const baseMeasurements = {
          shoulders: originalMeasurements.shoulders || 50,
          chest: originalMeasurements.chest || 50,
          arms: originalMeasurements.arms || 50,
          waist: originalMeasurements.waist || 50,
          legs: originalMeasurements.legs || 50,
        };
        
        switch (goal) {
          case 'build_muscle':
            progressMeasurements = {
              shoulders: baseMeasurements.shoulders + (15 * progressFactor), // +15% max
              chest: baseMeasurements.chest + (20 * progressFactor), // +20% max
              arms: baseMeasurements.arms + (25 * progressFactor), // +25% max
              waist: baseMeasurements.waist + (5 * progressFactor), // +5% max
              legs: baseMeasurements.legs + (18 * progressFactor), // +18% max
            };
            break;
            
          case 'weight_loss':
            progressMeasurements = {
              shoulders: baseMeasurements.shoulders - (5 * progressFactor), // -5% max
              chest: baseMeasurements.chest - (8 * progressFactor), // -8% max
              arms: baseMeasurements.arms - (3 * progressFactor), // -3% max
              waist: baseMeasurements.waist - (20 * progressFactor), // -20% max
              legs: baseMeasurements.legs - (10 * progressFactor), // -10% max
            };
            break;
            
          case 'increase_strength':
            progressMeasurements = {
              shoulders: baseMeasurements.shoulders + (12 * progressFactor), // +12% max
              chest: baseMeasurements.chest + (15 * progressFactor), // +15% max
              arms: baseMeasurements.arms + (20 * progressFactor), // +20% max
              waist: baseMeasurements.waist + (3 * progressFactor), // +3% max
              legs: baseMeasurements.legs + (15 * progressFactor), // +15% max
            };
            break;
            
          default:
            // General fitness improvement
            progressMeasurements = {
              shoulders: baseMeasurements.shoulders + (8 * progressFactor),
              chest: baseMeasurements.chest + (10 * progressFactor),
              arms: baseMeasurements.arms + (12 * progressFactor),
              waist: baseMeasurements.waist - (5 * progressFactor),
              legs: baseMeasurements.legs + (10 * progressFactor),
            };
        }
        
        // Ensure measurements stay within reasonable bounds (20-100)
        Object.keys(progressMeasurements).forEach(key => {
          progressMeasurements[key] = Math.max(20, Math.min(100, Math.round(progressMeasurements[key])));
        });
        
        set({ progressMeasurements });
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);