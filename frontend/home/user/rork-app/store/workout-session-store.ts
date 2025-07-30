import { create } from 'zustand';
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

export const useWorkoutSessionStore = create<WorkoutSessionStore>((set, get) => ({
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
    
    const updatedSession = {
      ...currentSession,
      currentExerciseIndex: currentSession.currentExerciseIndex + 1,
      completedExercises: [
        ...currentSession.completedExercises,
        currentSession.exercises[currentSession.currentExerciseIndex].name
      ],
    };
    
    set({ currentSession: updatedSession });
  },
  
  nextSet: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      currentSet: currentSession.currentSet + 1,
    };
    
    set({ currentSession: updatedSession });
  },
  
  startRest: (seconds: number) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      state: 'resting' as WorkoutSessionState,
      timerSeconds: seconds,
      isRestTimer: true,
    };
    
    set({ currentSession: updatedSession });
  },
  
  completeWorkout: () => {
    const { currentSession, completedWorkouts } = get();
    if (!currentSession) return;
    
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 60000);
    
    const completedWorkout: CompletedWorkout = {
      id: currentSession.id,
      workoutName: currentSession.workoutName,
      date: endTime,
      duration,
      exercisesCompleted: currentSession.completedExercises.length,
      totalExercises: currentSession.exercises.length,
    };
    
    set({
      currentSession: null,
      completedWorkouts: [...completedWorkouts, completedWorkout],
    });
    
    get().updateStats();
  },
  
  pauseWorkout: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      state: 'idle' as WorkoutSessionState,
    };
    
    set({ currentSession: updatedSession });
  },
  
  resumeWorkout: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      state: 'active' as WorkoutSessionState,
    };
    
    set({ currentSession: updatedSession });
  },
  
  cancelWorkout: () => {
    set({ currentSession: null });
  },
  
  updateTimer: (seconds: number) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      timerSeconds: seconds,
    };
    
    set({ currentSession: updatedSession });
  },
  
  updateStats: () => {
    const { completedWorkouts } = get();
    const totalWorkouts = completedWorkouts.length;
    const totalMinutes = completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    const totalExercises = completedWorkouts.reduce((sum, workout) => sum + workout.exercisesCompleted, 0);
    
    // Calculate weekly workouts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyWorkouts = completedWorkouts.filter(
      workout => workout.date >= oneWeekAgo
    ).length;
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasWorkout = completedWorkouts.some(workout => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate strength increase (simplified)
    const strengthIncrease = totalWorkouts > 0 ? Math.min((totalWorkouts * 2), 50) : 0;
    
    set({
      workoutStats: {
        totalWorkouts,
        totalMinutes,
        totalExercises,
        currentStreak,
        weeklyWorkouts,
        strengthIncrease,
      },
    });
  },
  
  getWeeklyWorkouts: () => {
    const { completedWorkouts } = get();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completedWorkouts.filter(workout => workout.date >= oneWeekAgo).length;
  },
  
  getTodayWorkouts: () => {
    const { completedWorkouts } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return completedWorkouts.filter(
      workout => workout.date >= today && workout.date < tomorrow
    );
  },
}));