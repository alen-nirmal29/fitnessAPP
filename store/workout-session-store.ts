import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '@/types/workout';

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

export interface CompletedWorkout {
  id: string;
  workoutName: string;
  date: Date;
  duration: number; // in minutes
  exercisesCompleted: number;
  totalExercises: number;
  caloriesBurned?: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalExercises: number;
  currentStreak: number;
  weeklyWorkouts: number;
  strengthIncrease: number; // percentage
}

interface WorkoutSessionStore {
  currentSession: WorkoutSession | null;
  completedWorkouts: CompletedWorkout[];
  workoutStats: WorkoutStats;
  
  // Session management
  startWorkout: (workoutName: string, exercises: Exercise[]) => void;
  completeExercise: () => void;
  nextSet: () => void;
  startRest: (seconds: number) => void;
  completeWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  cancelWorkout: () => void;
  
  // Timer management
  updateTimer: (seconds: number) => void;
  
  // Stats
  updateStats: () => void;
  getWeeklyWorkouts: () => number;
  getTodayWorkouts: () => CompletedWorkout[];
}

export const useWorkoutSessionStore = create<WorkoutSessionStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      completedWorkouts: [],
      workoutStats: {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalExercises: 0,
        currentStreak: 0,
        weeklyWorkouts: 0,
        strengthIncrease: 0,
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
      
      completeExercise: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
          const updatedCompletedExercises = [...currentSession.completedExercises, currentExercise.id];
          
          // Move to next exercise or complete workout
          if (currentSession.currentExerciseIndex < currentSession.exercises.length - 1) {
            const nextExerciseIndex = currentSession.currentExerciseIndex + 1;
            const nextExercise = currentSession.exercises[nextExerciseIndex];
            
            set({
              currentSession: {
                ...currentSession,
                currentExerciseIndex: nextExerciseIndex,
                currentSet: 1,
                totalSets: nextExercise.sets,
                completedExercises: updatedCompletedExercises,
                state: 'active',
                timerSeconds: 0,
                isRestTimer: false,
              }
            });
          } else {
            // All exercises completed
            set({
              currentSession: {
                ...currentSession,
                completedExercises: updatedCompletedExercises,
              }
            });
            get().completeWorkout();
          }
        } catch (error) {
          console.error('Error in completeExercise:', error);
          // Fallback to complete workout
          get().completeWorkout();
        }
      },
      
      nextSet: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        if (currentSession.currentSet < currentSession.totalSets) {
          // Start rest timer between sets
          const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
          get().startRest(currentExercise.restTime);
          
          set({
            currentSession: {
              ...currentSession,
              currentSet: currentSession.currentSet + 1,
            }
          });
        } else {
          // Exercise completed, move to next
          get().completeExercise();
        }
      },
      
      startRest: (seconds: number) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            state: 'resting',
            timerSeconds: seconds,
            isRestTimer: true,
          }
        });
      },
      
      completeWorkout: () => {
        const { currentSession, completedWorkouts } = get();
        if (!currentSession) return;
        
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 60000); // minutes
        
        const completedWorkout: CompletedWorkout = {
          id: currentSession.id,
          workoutName: currentSession.workoutName,
          date: endTime,
          duration,
          exercisesCompleted: currentSession.completedExercises.length,
          totalExercises: currentSession.exercises.length,
          caloriesBurned: Math.round(duration * 8), // Rough estimate
        };
        
        set({
          currentSession: {
            ...currentSession,
            endTime,
            state: 'completed',
          },
          completedWorkouts: [completedWorkout, ...completedWorkouts],
        });
        
        // Update stats
        get().updateStats();
        
        // Update workout plan progress (import this dynamically to avoid circular deps)
        try {
          const { useWorkoutStore } = require('./workout-store');
          const workoutStore = useWorkoutStore.getState();
          
          if (workoutStore.currentPlan) {
            // Calculate progress based on completed workouts vs total plan workouts
            const totalPlanWorkouts = workoutStore.currentPlan.schedule.filter((day: { restDay?: boolean }) => !day.restDay).length;
            const planWorkouts = completedWorkouts.filter(w => 
              w.workoutName.includes(workoutStore.currentPlan!.name) || 
              workoutStore.currentPlan!.schedule.some((day: { name?: string }) => day.name?.includes(w.workoutName))
            ).length + 1; // +1 for current workout
            
            const progressPercentage = Math.min((planWorkouts / totalPlanWorkouts) * 100, 100);
            workoutStore.updateWorkoutProgress(workoutStore.currentPlan.id, progressPercentage);
            
            // Generate progress measurements if we have user measurements
            const { useAuthStore } = require('./auth-store');
            const authStore = useAuthStore.getState();
            
            if (authStore.user?.currentMeasurements && progressPercentage > 0) {
              const currentMeasurements = {
                shoulders: authStore.user.currentMeasurements.shoulders,
                chest: authStore.user.currentMeasurements.chest,
                arms: authStore.user.currentMeasurements.arms,
                waist: authStore.user.currentMeasurements.waist,
                legs: authStore.user.currentMeasurements.legs,
              };
              workoutStore.generateProgressMeasurements(
                currentMeasurements, 
                workoutStore.currentPlan.specificGoal, 
                progressPercentage
              );
            }
          }
        } catch (error) {
          console.log('Could not update workout progress:', error);
        }
        
        // Clear session after a delay
        setTimeout(() => {
          set({ currentSession: null });
        }, 3000);
      },
      
      pauseWorkout: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            state: 'idle',
          }
        });
      },
      
      resumeWorkout: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            state: currentSession.isRestTimer ? 'resting' : 'active',
          }
        });
      },
      
      cancelWorkout: () => {
        set({ currentSession: null });
      },
      
      updateTimer: (seconds: number) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            timerSeconds: seconds,
          }
        });
        
        // Auto-resume from rest when timer reaches 0
        if (seconds === 0 && currentSession.isRestTimer) {
          set({
            currentSession: {
              ...currentSession,
              state: 'active',
              isRestTimer: false,
            }
          });
        }
      },
      
      updateStats: () => {
        const { completedWorkouts } = get();
        
        const totalWorkouts = completedWorkouts.length;
        const totalMinutes = completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
        const totalExercises = completedWorkouts.reduce((sum, workout) => sum + workout.exercisesCompleted, 0);
        
        // Calculate weekly workouts
        const weeklyWorkouts = get().getWeeklyWorkouts();
        
        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        const sortedWorkouts = [...completedWorkouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        for (const workout of sortedWorkouts) {
          const workoutDate = new Date(workout.date);
          const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= currentStreak + 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        // Calculate strength increase (mock calculation based on workout frequency)
        const strengthIncrease = Math.min(totalWorkouts * 2, 50); // Cap at 50%
        
        set({
          workoutStats: {
            totalWorkouts,
            totalMinutes,
            totalExercises,
            currentStreak,
            weeklyWorkouts,
            strengthIncrease,
          }
        });
      },
      
      getWeeklyWorkouts: () => {
        const { completedWorkouts } = get();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return completedWorkouts.filter(workout => 
          new Date(workout.date) >= oneWeekAgo
        ).length;
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
    }),
    {
      name: 'workout-session-storage',
      // Add a custom hydrate function to ensure startTime and endTime are Dates
      onRehydrateStorage: () => (state) => {
        if (state && state.currentSession) {
          if (state.currentSession.startTime && typeof state.currentSession.startTime === 'string') {
            state.currentSession.startTime = new Date(state.currentSession.startTime);
          }
          if (state.currentSession.endTime && typeof state.currentSession.endTime === 'string') {
            state.currentSession.endTime = new Date(state.currentSession.endTime);
          }
        }
      },
    }
  )
);