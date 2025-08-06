import { create } from 'zustand';
import { Exercise } from '@/types/workout';
import { workoutAPI } from '@/services/api';
import { progressAPI } from '@/services/api';

export type WorkoutSessionState = 'idle' | 'active' | 'resting' | 'completed';

export interface WorkoutSession {
  id: string;
  workoutName: string;
  exercises: Exercise[];
  currentExerciseIndex: number;
  currentSet: number;
  totalSets: number;
  startTime: Date;
  endTime?: Date;
  completedExercises: string[];
  state: WorkoutSessionState;
  timerSeconds: number;
  isRestTimer: boolean;
}

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  reps: number;
  weight?: number;
  duration?: number;
  restTime: number;
  notes: string;
  difficultyRating?: number;
}

interface WorkoutSessionStore {
  currentSession: WorkoutSession | null;
  completedWorkouts: WorkoutSession[];
  workoutStats: {
    totalWorkouts: number;
    weeklyWorkouts: number;
    totalExercises: number;
    strengthIncrease: number;
    caloriesBurned: number;
  };
  
  startWorkout: (workoutName: string, exercises: Exercise[]) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseSet: (exerciseId: string, reps: number, weight?: number, duration?: number) => void;
  updateExerciseSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  getTodayWorkouts: () => WorkoutSession[];
  getWeeklyWorkouts: () => WorkoutSession[];
  saveWorkoutToDatabase: (session: WorkoutSession) => Promise<void>;
  
  // Additional functions for session screen
  nextSet: () => void;
  completeExercise: () => void;
  updateTimer: (seconds: number) => void;
  startRest: (seconds: number) => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionStore>((set, get) => ({
  currentSession: null,
  completedWorkouts: [],
  workoutStats: {
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    totalExercises: 0,
    strengthIncrease: 0,
    caloriesBurned: 0,
  },

  startWorkout: (workoutName: string, exercises: Exercise[]) => {
    const session: WorkoutSession = {
      id: Date.now().toString(),
      workoutName,
      exercises,
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSets: exercises[0]?.sets || 1,
      startTime: new Date(),
      completedExercises: [],
      state: 'active',
      timerSeconds: 0,
      isRestTimer: false,
    };
    set({ currentSession: session });
  },

  pauseWorkout: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          state: 'idle',
        },
      });
    }
  },

  resumeWorkout: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          state: 'active',
        },
      });
    }
  },

  completeWorkout: async () => {
    const { currentSession, completedWorkouts } = get();
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 60000);
      
      const completedSession: WorkoutSession = {
        ...currentSession,
        endTime,
        state: 'completed',
      };

      // Save to database
      try {
        await get().saveWorkoutToDatabase(completedSession);
        console.log('✅ Workout saved to database successfully');
      } catch (error) {
        console.error('❌ Failed to save workout to database:', error);
        // Continue with local state even if database save fails
      }

      set({
        currentSession: null,
        completedWorkouts: [...completedWorkouts, completedSession],
        workoutStats: {
          ...get().workoutStats,
          totalWorkouts: get().workoutStats.totalWorkouts + 1,
          weeklyWorkouts: get().getWeeklyWorkouts().length + 1,
        },
      });
    }
  },

  cancelWorkout: () => {
    set({ currentSession: null });
  },

  addExerciseSet: (exerciseId, reps, weight, duration) => {
    const { currentSession } = get();
    if (currentSession) {
      const newSet: ExerciseSet = {
        id: `set-${Date.now()}`,
        exerciseId,
        reps,
        weight,
        duration,
        restTime: 60,
        notes: '',
        difficultyRating: null,
      };

      set({
        currentSession: {
          ...currentSession,
          exercises: [...currentSession.exercises, newSet],
        },
      });
    }
  },

  updateExerciseSet: (setId, updates) => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedExercises = currentSession.exercises.map((exercise) =>
        exercise.id === setId ? { ...exercise, ...updates } : exercise
      );

      set({
        currentSession: {
          ...currentSession,
          exercises: updatedExercises,
        },
      });
    }
  },

  getTodayWorkouts: () => {
    const { completedWorkouts } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate >= today && workoutDate < tomorrow;
    });
  },

  getWeeklyWorkouts: () => {
    const { completedWorkouts } = get();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate >= oneWeekAgo;
    });
  },

  // Additional functions for session screen
  nextSet: () => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        currentSet: currentSession.currentSet + 1,
      };
      set({ currentSession: updatedSession });
    }
  },

  completeExercise: () => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        currentExerciseIndex: currentSession.currentExerciseIndex + 1,
        completedExercises: [
          ...currentSession.completedExercises,
          currentSession.exercises[currentSession.currentExerciseIndex].name
        ],
      };
      set({ currentSession: updatedSession });
    }
  },

  updateTimer: (seconds: number) => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        timerSeconds: seconds,
      };
      set({ currentSession: updatedSession });
    }
  },

  startRest: (seconds: number) => {
    const { currentSession } = get();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        state: 'resting',
        timerSeconds: seconds,
        isRestTimer: true,
      };
      set({ currentSession: updatedSession });
    }
  },

  saveWorkoutToDatabase: async (session) => {
    try {
      console.log('💾 Saving workout session to database...', session);
      
      // Prepare the session data for the API
      const sessionData = {
        plan_id: session.id,
        day_id: session.workoutName,
        status: 'completed',
        started_at: session.startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration: Math.round((new Date().getTime() - session.startTime.getTime()) / 60000),
        total_exercises: session.exercises.length,
        completed_exercises: session.completedExercises.length,
        notes: '',
        rating: null
      };

      // Create the workout session
      const savedSession = await workoutAPI.createSession(sessionData);
      console.log('✅ Workout session created:', savedSession);

      // Save exercise sets if there are any
      if (session.exercises.length > 0) {
        const exerciseSetsData = session.exercises.map((exercise, index) => ({
          session: savedSession.id, // integer PK
          exercise: parseInt(exercise.id, 10), // integer PK
          set_number: index + 1,
          reps_completed: exercise.reps,
          weight_used: 0, // Default weight
          duration: 0, // Default duration
          rest_time: exercise.restTime || 60,
          notes: '',
          difficulty_rating: null
        }));

        // Save each exercise set
        for (const setData of exerciseSetsData) {
          try {
            await workoutAPI.createExerciseSet(setData);
            console.log('✅ Exercise set saved:', setData);
          } catch (setError) {
            console.error('❌ Failed to save exercise set:', setError);
            // Continue with other sets even if one fails
          }
        }
      }

      // Save progress data
      const progressData = {
        session_id: savedSession.id,
        workout_type: session.workoutName,
        duration_minutes: sessionData.duration,
        calories_burned: Math.round(sessionData.duration * 8), // Rough estimate
        exercises_completed: session.completedExercises.length,
        notes: '',
        date: new Date().toISOString(), // Add date field
      };

      await progressAPI.saveEntry(progressData);
      console.log('✅ Workout progress saved:', progressData);
      
      console.log('✅ Workout session and all data saved to database successfully');
    } catch (error) {
      console.error('❌ Failed to save workout session:', error);
      throw new Error(`Failed to save workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}));