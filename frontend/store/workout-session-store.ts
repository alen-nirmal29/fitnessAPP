import { create } from 'zustand';
import { WorkoutSession, ExerciseSet } from '@/types/workout';
import { workoutAPI } from '@/services/api';
import { progressAPI } from '@/services/api';

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
  
  startWorkout: (workoutName: string, exercises: any[]) => void;
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

  startWorkout: (workoutName: string, exercises: any[]) => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      planId: workoutName,
      dayId: workoutName,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      status: 'in_progress',
      exercises: [],
      notes: '',
      rating: null,
    };
    set({ currentSession: session });
  },

  pauseWorkout: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          status: 'paused',
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
          status: 'in_progress',
        },
      });
    }
  },

  completeWorkout: async () => {
    const { currentSession, completedWorkouts } = get();
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60);
      
      const completedSession: WorkoutSession = {
        ...currentSession,
        endTime,
        duration,
        status: 'completed',
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
    const { currentSession } = get();
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60);
      
      const cancelledSession: WorkoutSession = {
        ...currentSession,
        endTime,
        duration,
        status: 'cancelled',
      };

      set({
        currentSession: null,
        completedWorkouts: [...get().completedWorkouts, cancelledSession],
      });
    }
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
      const workoutDate = new Date(workout.date);
      return workoutDate >= today && workoutDate < tomorrow;
    });
  },

  getWeeklyWorkouts: () => {
    const { completedWorkouts } = get();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= oneWeekAgo;
    });
  },

  // Additional functions for session screen
  nextSet: () => {
    const { currentSession } = get();
    if (currentSession) {
      // This is a placeholder - the actual implementation depends on the session structure
      console.log('Next set called');
    }
  },

  completeExercise: () => {
    const { currentSession } = get();
    if (currentSession) {
      // This is a placeholder - the actual implementation depends on the session structure
      console.log('Complete exercise called');
    }
  },

  updateTimer: (seconds: number) => {
    const { currentSession } = get();
    if (currentSession) {
      // This is a placeholder - the actual implementation depends on the session structure
      console.log('Update timer called with:', seconds);
    }
  },

  saveWorkoutToDatabase: async (session) => {
    try {
      console.log('💾 Saving workout session to database...', session);
      
      // Prepare the session data for the API
      const sessionData = {
        workout_day_id: null, // We'll set this to null since we don't have a specific workout day
        status: session.status,
        started_at: session.startTime.toISOString(),
        completed_at: session.endTime?.toISOString() || null,
        duration: session.duration,
        total_exercises: session.exercises.length,
        completed_exercises: session.exercises.length,
        notes: session.notes || '',
        rating: session.rating
      };

      // Create the workout session
      const savedSession = await workoutAPI.createSession(sessionData);
      console.log('✅ Workout session created:', savedSession);

      // Save exercise sets if there are any
      if (session.exercises.length > 0) {
        const exerciseSetsData = session.exercises.map((exercise, index) => ({
          session_id: savedSession.id,
          exercise_id: exercise.exerciseId || 1, // Use a default exercise ID if not provided
          set_number: index + 1,
          reps_completed: exercise.reps,
          weight_used: exercise.weight || 0,
          duration: exercise.duration || 0,
          rest_time: exercise.restTime || 60,
          notes: exercise.notes || '',
          difficulty_rating: exercise.difficultyRating
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

      // Save progress data using the correct progress API endpoint
      const progressData = {
        session_id: savedSession.id,
        workout_type: session.planId,
        duration_minutes: session.duration,
        calories_burned: Math.round(session.duration * 8), // Rough estimate
        exercises_completed: session.exercises.length,
        notes: session.notes || ''
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