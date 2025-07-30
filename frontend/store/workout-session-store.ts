import { create } from 'zustand';
import { WorkoutSession, ExerciseSet } from '@/types/workout';

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
  
  startWorkout: (planId: string, dayId: string) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseSet: (exerciseId: string, reps: number, weight?: number, duration?: number) => void;
  updateExerciseSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  getTodayWorkouts: () => WorkoutSession[];
  getWeeklyWorkouts: () => WorkoutSession[];
  saveWorkoutToDatabase: (session: WorkoutSession) => Promise<void>;
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

  startWorkout: (planId, dayId) => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      planId,
      dayId,
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

  completeWorkout: () => {
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
      get().saveWorkoutToDatabase(completedSession);

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

  saveWorkoutToDatabase: async (session) => {
    try {
      console.log('💾 Saving workout session to database...');
      // This would call the API to save the workout session
      // await workoutAPI.saveProgress({
      //   session: {
      //     status: session.status,
      //     started_at: session.startTime,
      //     completed_at: session.endTime,
      //     duration: session.duration,
      //     total_exercises: session.exercises.length,
      //     completed_exercises: session.exercises.length,
      //     notes: session.notes || '',
      //     rating: session.rating
      //   },
      //   exercise_sets: session.exercises.map((exercise, index) => ({
      //     exercise_id: exercise.exerciseId,
      //     set_number: index + 1,
      //     reps_completed: exercise.reps,
      //     weight_used: exercise.weight,
      //     duration: exercise.duration,
      //     rest_time: exercise.restTime,
      //     notes: exercise.notes || '',
      //     difficulty_rating: exercise.difficultyRating
      //   }))
      // });
      console.log('✅ Workout session saved to database');
    } catch (error) {
      console.error('❌ Failed to save workout session:', error);
    }
  },
}));