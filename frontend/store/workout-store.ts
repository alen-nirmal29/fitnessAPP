import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan, WorkoutDifficulty, WorkoutDuration } from '@/types/workout';
import { SpecificGoal } from '@/types/user';

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
          // Call the AI API to generate a personalized workout plan
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a professional fitness trainer and exercise physiologist. Create detailed, personalized workout plans based on user goals, body composition, and fitness level. Always provide specific exercises, sets, reps, and rest times.'
                },
                {
                  role: 'user',
                  content: `Create a comprehensive ${duration.replace('_', ' ')} workout plan for someone with the goal: ${specificGoal.replace('_', ' ')}. 
                  
                  User Details:
                  - Goal: ${specificGoal.replace('_', ' ')}
                  - Duration: ${duration.replace('_', ' ')}
                  - Additional context: ${userDetails || 'Standard fitness level'}
                  
                  Please provide:
                  1. A plan name
                  2. A detailed description
                  3. A weekly schedule with 4-7 days (including rest days)
                  4. Sets, reps, and rest times for each exercise
                  5. Progressive overload recommendations
                  
                  IMPORTANT: Create a weekly schedule with at least 4-7 days. Include both workout days and rest days.
                  
                  Format as JSON with this structure:
                  {
                    "name": "Plan Name",
                    "description": "Detailed description",
                    "difficulty": "beginner|intermediate|advanced",
                    "schedule": [
                      {
                        "name": "Day 1: Workout Name",
                        "exercises": [
                          {
                            "name": "Exercise Name",
                            "description": "How to perform",
                            "muscleGroup": "primary muscle",
                            "sets": 3,
                            "reps": 10,
                            "restTime": 90
                          }
                        ],
                        "restDay": false
                      },
                      {
                        "name": "Day 2: Rest Day",
                        "exercises": [],
                        "restDay": true
                      }
                    ]
                  }`
                }
              ]
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to generate workout plan');
          }
          
          const data = await response.json();
          let aiPlan;
          
          try {
            // Try to parse the AI response as JSON
            const jsonMatch = data.completion.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiPlan = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback to a structured plan based on the goal
            aiPlan = generateFallbackPlan(specificGoal, duration);
          }
          
          const workoutPlan: WorkoutPlan = {
            id: `ai-generated-${Date.now()}`,
            name: aiPlan.name || `Custom ${specificGoal.replace('_', ' ')} Plan`,
            description: aiPlan.description || `AI-generated workout plan for ${specificGoal.replace('_', ' ')}`,
            difficulty: (aiPlan.difficulty as WorkoutDifficulty) || 'intermediate',
            duration: duration as WorkoutDuration,
            specificGoal,
            isAIGenerated: true,
            schedule: aiPlan.schedule?.map((day: any, index: number) => ({
              id: `day-${index + 1}`,
              name: day.name || `Day ${index + 1}`,
              exercises: day.exercises?.map((ex: any, exIndex: number) => ({
                id: `ex-${index}-${exIndex}`,
                name: ex.name || 'Exercise',
                description: ex.description || 'Perform as instructed',
                muscleGroup: ex.muscleGroup || 'full_body',
                sets: ex.sets || 3,
                reps: ex.reps || 10,
                restTime: ex.restTime || 90,
              })) || [],
              restDay: day.restDay || false,
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
            error: 'AI generation failed, using fallback plan' // Show user that fallback was used
          });
        }
      },
      
      getRecommendedPlans: async (specificGoal: SpecificGoal, userDetails?: any) => {
        set({ isLoading: true, error: null });
        try {
          // Call AI to get personalized recommendations
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a fitness expert. Recommend 3 different workout plans based on user goals and body composition. Consider beginner, intermediate, and advanced levels.'
                },
                {
                  role: 'user',
                  content: `Recommend 3 workout plans for someone with goal: ${specificGoal.replace('_', ' ')}. User details: ${JSON.stringify(userDetails || {})}. 
                  
                  Provide plans for different durations and difficulty levels. Format as JSON array:
                  [
                    {
                      "name": "Plan Name",
                      "description": "Why this plan is good for the user",
                      "difficulty": "beginner|intermediate|advanced",
                      "duration": "1_month|3_month|6_month",
                      "highlights": ["key benefit 1", "key benefit 2"]
                    }
                  ]`
                }
              ]
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to get recommendations');
          }
          
          const data = await response.json();
          let aiRecommendations = [];
          
          try {
            const jsonMatch = data.completion.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              aiRecommendations = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error('Failed to parse AI recommendations:', parseError);
          }
          
          // Generate plans based on AI recommendations or fallback
          const recommendedPlans: WorkoutPlan[] = aiRecommendations.length > 0 
            ? aiRecommendations.map((rec: any, index: number) => ({
                id: `rec-plan-${index + 1}`,
                name: rec.name || `${specificGoal.replace('_', ' ')} Plan ${index + 1}`,
                description: rec.description || `Tailored plan for ${specificGoal.replace('_', ' ')}`,
                difficulty: (rec.difficulty as WorkoutDifficulty) || 'intermediate',
                duration: (rec.duration as WorkoutDuration) || '1_month',
                specificGoal,
                isAIGenerated: true,
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
                  {
                    id: 'day-3',
                    name: 'Day 3: Upper Body',
                    exercises: [
                      {
                        id: 'ex-3',
                        name: 'Pull-ups',
                        description: 'Upper body strength',
                        muscleGroup: 'back',
                        sets: 3,
                        reps: 8,
                        restTime: 90,
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
                    name: 'Day 5: Lower Body',
                    exercises: [
                      {
                        id: 'ex-4',
                        name: 'Lunges',
                        description: 'Lower body strength',
                        muscleGroup: 'legs',
                        sets: 3,
                        reps: 12,
                        restTime: 60,
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
                        id: 'ex-5',
                        name: 'Walking',
                        description: 'Light cardio',
                        muscleGroup: 'cardio',
                        sets: 1,
                        reps: 30,
                        restTime: 0,
                      },
                    ],
                    restDay: false,
                  },
                ],
              }))
            : [
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
                    {
                      id: 'day-3',
                      name: 'Day 3: Upper Body',
                      exercises: [
                        {
                          id: 'ex-3',
                          name: 'Pull-ups',
                          description: 'Upper body strength',
                          muscleGroup: 'back',
                          sets: 3,
                          reps: 8,
                          restTime: 90,
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
                      name: 'Day 5: Lower Body',
                      exercises: [
                        {
                          id: 'ex-4',
                          name: 'Lunges',
                          description: 'Lower body strength',
                          muscleGroup: 'legs',
                          sets: 3,
                          reps: 12,
                          restTime: 60,
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
                          id: 'ex-5',
                          name: 'Walking',
                          description: 'Light cardio',
                          muscleGroup: 'cardio',
                          sets: 1,
                          reps: 30,
                          restTime: 0,
                        },
                      ],
                      restDay: false,
                    },
                  ],
                },
                {
                  id: 'plan-2',
                  name: '90-Day Progressive Training',
                  description: 'Intermediate plan with progressive overload tailored to your measurements',
                  difficulty: 'intermediate' as WorkoutDifficulty,
                  duration: '3_month' as WorkoutDuration,
                  specificGoal,
                  isAIGenerated: false,
                  schedule: [
                    {
                      id: 'day-1',
                      name: 'Day 1: Chest & Triceps',
                      exercises: [
                        {
                          id: 'ex-1',
                          name: 'Bench Press',
                          description: 'Compound chest exercise',
                          muscleGroup: 'chest',
                          sets: 4,
                          reps: 8,
                          restTime: 120,
                        },
                        {
                          id: 'ex-2',
                          name: 'Tricep Dips',
                          description: 'Tricep isolation',
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
                          id: 'ex-3',
                          name: 'Pull-ups',
                          description: 'Back strength',
                          muscleGroup: 'back',
                          sets: 4,
                          reps: 8,
                          restTime: 120,
                        },
                        {
                          id: 'ex-4',
                          name: 'Bicep Curls',
                          description: 'Bicep isolation',
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
                      name: 'Day 3: Rest',
                      exercises: [],
                      restDay: true,
                    },
                    {
                      id: 'day-4',
                      name: 'Day 4: Legs',
                      exercises: [
                        {
                          id: 'ex-5',
                          name: 'Squats',
                          description: 'Compound leg exercise',
                          muscleGroup: 'legs',
                          sets: 4,
                          reps: 10,
                          restTime: 120,
                        },
                        {
                          id: 'ex-6',
                          name: 'Deadlifts',
                          description: 'Posterior chain',
                          muscleGroup: 'legs',
                          sets: 3,
                          reps: 8,
                          restTime: 180,
                        },
                      ],
                      restDay: false,
                    },
                    {
                      id: 'day-5',
                      name: 'Day 5: Shoulders',
                      exercises: [
                        {
                          id: 'ex-7',
                          name: 'Overhead Press',
                          description: 'Shoulder strength',
                          muscleGroup: 'shoulders',
                          sets: 4,
                          reps: 8,
                          restTime: 120,
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
                      name: 'Day 7: Cardio',
                      exercises: [
                        {
                          id: 'ex-8',
                          name: 'Running',
                          description: 'Cardiovascular training',
                          muscleGroup: 'cardio',
                          sets: 1,
                          reps: 30,
                          restTime: 0,
                        },
                      ],
                      restDay: false,
                    },
                  ],
                },
                {
                  id: 'plan-3',
                  name: '6-Month Transformation',
                  description: 'Advanced comprehensive program based on your current physique',
                  difficulty: 'advanced' as WorkoutDifficulty,
                  duration: '6_month' as WorkoutDuration,
                  specificGoal,
                  isAIGenerated: false,
                  schedule: [
                    {
                      id: 'day-1',
                      name: 'Day 1: Push',
                      exercises: [
                        {
                          id: 'ex-1',
                          name: 'Bench Press',
                          description: 'Heavy compound',
                          muscleGroup: 'chest',
                          sets: 5,
                          reps: 5,
                          restTime: 180,
                        },
                        {
                          id: 'ex-2',
                          name: 'Overhead Press',
                          description: 'Shoulder strength',
                          muscleGroup: 'shoulders',
                          sets: 4,
                          reps: 6,
                          restTime: 120,
                        },
                      ],
                      restDay: false,
                    },
                    {
                      id: 'day-2',
                      name: 'Day 2: Pull',
                      exercises: [
                        {
                          id: 'ex-3',
                          name: 'Deadlifts',
                          description: 'Posterior chain',
                          muscleGroup: 'legs',
                          sets: 5,
                          reps: 5,
                          restTime: 240,
                        },
                        {
                          id: 'ex-4',
                          name: 'Pull-ups',
                          description: 'Back strength',
                          muscleGroup: 'back',
                          sets: 4,
                          reps: 8,
                          restTime: 120,
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
                      name: 'Day 4: Legs',
                      exercises: [
                        {
                          id: 'ex-5',
                          name: 'Squats',
                          description: 'Heavy compound',
                          muscleGroup: 'legs',
                          sets: 5,
                          reps: 5,
                          restTime: 180,
                        },
                        {
                          id: 'ex-6',
                          name: 'Romanian Deadlifts',
                          description: 'Hamstring focus',
                          muscleGroup: 'legs',
                          sets: 4,
                          reps: 8,
                          restTime: 120,
                        },
                      ],
                      restDay: false,
                    },
                    {
                      id: 'day-5',
                      name: 'Day 5: Accessory',
                      exercises: [
                        {
                          id: 'ex-7',
                          name: 'Lateral Raises',
                          description: 'Shoulder isolation',
                          muscleGroup: 'shoulders',
                          sets: 3,
                          reps: 15,
                          restTime: 60,
                        },
                        {
                          id: 'ex-8',
                          name: 'Bicep Curls',
                          description: 'Arm isolation',
                          muscleGroup: 'arms',
                          sets: 3,
                          reps: 12,
                          restTime: 60,
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
                      name: 'Day 7: Conditioning',
                      exercises: [
                        {
                          id: 'ex-9',
                          name: 'Sprint Intervals',
                          description: 'High intensity cardio',
                          muscleGroup: 'cardio',
                          sets: 8,
                          reps: 30,
                          restTime: 60,
                        },
                      ],
                      restDay: false,
                    },
                  ],
                },
              ];
          
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
                {
                  id: 'day-3',
                  name: 'Day 3: Upper Body',
                  exercises: [
                    {
                      id: 'ex-3',
                      name: 'Pull-ups',
                      description: 'Upper body strength',
                      muscleGroup: 'back',
                      sets: 3,
                      reps: 8,
                      restTime: 90,
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
                  name: 'Day 5: Lower Body',
                  exercises: [
                    {
                      id: 'ex-4',
                      name: 'Lunges',
                      description: 'Lower body strength',
                      muscleGroup: 'legs',
                      sets: 3,
                      reps: 12,
                      restTime: 60,
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
                      id: 'ex-5',
                      name: 'Walking',
                      description: 'Light cardio',
                      muscleGroup: 'cardio',
                      sets: 1,
                      reps: 30,
                      restTime: 0,
                    },
                  ],
                  restDay: false,
                },
              ],
            },
            {
              id: 'plan-2',
              name: '90-Day Progressive',
              description: 'Intermediate plan with progressive training',
              difficulty: 'intermediate' as WorkoutDifficulty,
              duration: '3_month' as WorkoutDuration,
              specificGoal,
              isAIGenerated: false,
              schedule: [
                {
                  id: 'day-1',
                  name: 'Day 1: Chest & Triceps',
                  exercises: [
                    {
                      id: 'ex-1',
                      name: 'Bench Press',
                      description: 'Compound chest exercise',
                      muscleGroup: 'chest',
                      sets: 4,
                      reps: 8,
                      restTime: 120,
                    },
                    {
                      id: 'ex-2',
                      name: 'Tricep Dips',
                      description: 'Tricep isolation',
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
                      id: 'ex-3',
                      name: 'Pull-ups',
                      description: 'Back strength',
                      muscleGroup: 'back',
                      sets: 4,
                      reps: 8,
                      restTime: 120,
                    },
                    {
                      id: 'ex-4',
                      name: 'Bicep Curls',
                      description: 'Bicep isolation',
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
                  name: 'Day 3: Rest',
                  exercises: [],
                  restDay: true,
                },
                {
                  id: 'day-4',
                  name: 'Day 4: Legs',
                  exercises: [
                    {
                      id: 'ex-5',
                      name: 'Squats',
                      description: 'Compound leg exercise',
                      muscleGroup: 'legs',
                      sets: 4,
                      reps: 10,
                      restTime: 120,
                    },
                    {
                      id: 'ex-6',
                      name: 'Deadlifts',
                      description: 'Posterior chain',
                      muscleGroup: 'legs',
                      sets: 3,
                      reps: 8,
                      restTime: 180,
                    },
                  ],
                  restDay: false,
                },
                {
                  id: 'day-5',
                  name: 'Day 5: Shoulders',
                  exercises: [
                    {
                      id: 'ex-7',
                      name: 'Overhead Press',
                      description: 'Shoulder strength',
                      muscleGroup: 'shoulders',
                      sets: 4,
                      reps: 8,
                      restTime: 120,
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
                  name: 'Day 7: Cardio',
                  exercises: [
                    {
                      id: 'ex-8',
                      name: 'Running',
                      description: 'Cardiovascular training',
                      muscleGroup: 'cardio',
                      sets: 1,
                      reps: 30,
                      restTime: 0,
                    },
                  ],
                  restDay: false,
                },
              ],
            },
            {
              id: 'plan-3',
              name: '6-Month Transformation',
              description: 'Advanced comprehensive transformation program',
              difficulty: 'advanced' as WorkoutDifficulty,
              duration: '6_month' as WorkoutDuration,
              specificGoal,
              isAIGenerated: false,
              schedule: [
                {
                  id: 'day-1',
                  name: 'Day 1: Push',
                  exercises: [
                    {
                      id: 'ex-1',
                      name: 'Bench Press',
                      description: 'Heavy compound',
                      muscleGroup: 'chest',
                      sets: 5,
                      reps: 5,
                      restTime: 180,
                    },
                    {
                      id: 'ex-2',
                      name: 'Overhead Press',
                      description: 'Shoulder strength',
                      muscleGroup: 'shoulders',
                      sets: 4,
                      reps: 6,
                      restTime: 120,
                    },
                  ],
                  restDay: false,
                },
                {
                  id: 'day-2',
                  name: 'Day 2: Pull',
                  exercises: [
                    {
                      id: 'ex-3',
                      name: 'Deadlifts',
                      description: 'Posterior chain',
                      muscleGroup: 'legs',
                      sets: 5,
                      reps: 5,
                      restTime: 240,
                    },
                    {
                      id: 'ex-4',
                      name: 'Pull-ups',
                      description: 'Back strength',
                      muscleGroup: 'back',
                      sets: 4,
                      reps: 8,
                      restTime: 120,
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
                  name: 'Day 4: Legs',
                  exercises: [
                    {
                      id: 'ex-5',
                      name: 'Squats',
                      description: 'Heavy compound',
                      muscleGroup: 'legs',
                      sets: 5,
                      reps: 5,
                      restTime: 180,
                    },
                    {
                      id: 'ex-6',
                      name: 'Romanian Deadlifts',
                      description: 'Hamstring focus',
                      muscleGroup: 'legs',
                      sets: 4,
                      reps: 8,
                      restTime: 120,
                    },
                  ],
                  restDay: false,
                },
                {
                  id: 'day-5',
                  name: 'Day 5: Accessory',
                  exercises: [
                    {
                      id: 'ex-7',
                      name: 'Lateral Raises',
                      description: 'Shoulder isolation',
                      muscleGroup: 'shoulders',
                      sets: 3,
                      reps: 15,
                      restTime: 60,
                    },
                    {
                      id: 'ex-8',
                      name: 'Bicep Curls',
                      description: 'Arm isolation',
                      muscleGroup: 'arms',
                      sets: 3,
                      reps: 12,
                      restTime: 60,
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
                  name: 'Day 7: Conditioning',
                  exercises: [
                    {
                      id: 'ex-9',
                      name: 'Sprint Intervals',
                      description: 'High intensity cardio',
                      muscleGroup: 'cardio',
                      sets: 8,
                      reps: 30,
                      restTime: 60,
                    },
                  ],
                  restDay: false,
                },
              ],
            },
          ];
          
          set({
            recommendedPlans: fallbackPlans,
            error: 'AI recommendations unavailable, showing default plans',
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