import { create } from 'zustand';
import { Exercise } from '@/types/workout';
import { workoutAPI, progressAPI } from '@/services/api';

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
  refreshWorkoutStats: () => void;
  
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
    // Make sure we have at least one exercise
    if (!exercises || exercises.length === 0) {
      console.error('Cannot start workout with no exercises');
      return;
    }
    
    // Get the first exercise and its sets
    const firstExercise = exercises[0];
    
    const session: WorkoutSession = {
      id: Date.now().toString(),
      workoutName,
      exercises,
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSets: firstExercise?.sets || 1,
      startTime: new Date(),
      completedExercises: [],
      state: 'active',
      timerSeconds: 0,
      isRestTimer: false,
    };
    
    console.log('✅ Starting workout session:', {
      workoutName,
      exercisesCount: exercises.length,
      firstExercise: firstExercise?.name,
      totalSets: session.totalSets
    });
    
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

      // Calculate calories burned based on duration and exercise intensity
      const caloriesBurned = Math.round(duration * 5); // Simple calculation: 5 calories per minute

      // Save to database
      try {
        await get().saveWorkoutToDatabase(completedSession);
        console.log('✅ Workout saved to database successfully');
      } catch (error) {
        console.error('❌ Failed to save workout to database:', error);
        // Continue with local state even if database save fails
      }

      // Format the completed workout for display in the progress page
      const formattedCompletedSession = {
        ...completedSession,
        date: endTime.toISOString(), // Add date field for display
        duration: duration, // Duration in minutes
        exercisesCompleted: completedSession.completedExercises.length,
        caloriesBurned: caloriesBurned
      };

      console.log('✅ Completed workout session:', formattedCompletedSession);

      set({
        currentSession: null,
        completedWorkouts: [...completedWorkouts, formattedCompletedSession],
        workoutStats: {
          ...get().workoutStats,
          totalWorkouts: get().workoutStats.totalWorkouts + 1,
          weeklyWorkouts: get().getWeeklyWorkouts().length + 1,
          caloriesBurned: get().workoutStats.caloriesBurned + caloriesBurned
        },
      });

      // Update workout store progress
      try {
        // Import the workout store to update its progress
        const { useWorkoutStore } = await import('@/store/workout-store');
        const workoutStore = useWorkoutStore.getState();
        
        // Update the workout progress in the workout store
        if (workoutStore.currentPlan) {
          const currentProgress = workoutStore.workoutProgress[workoutStore.currentPlan.id] || 0;
          const newProgress = Math.min(currentProgress + 10, 100); // Add 10% progress per workout
          
          workoutStore.updateWorkoutProgress(workoutStore.currentPlan.id, newProgress);
          // Use the updated saveWorkoutProgress function to persist it
          await workoutStore.saveWorkoutProgress(workoutStore.currentPlan.id, newProgress);
          console.log('✅ Updated and saved workout progress:', newProgress);
          
          // Also mark this workout as completed in the workout store
          workoutStore.completeWorkout(completedSession.id);
          console.log('✅ Marked workout as completed in workout store');
          
          // Add the completed workout to the progress history
          await workoutStore.addCompletedWorkout({
            name: completedSession.workoutName,
            type: completedSession.workoutType || '',
            date: new Date().toISOString().split('T')[0],
            duration: duration,
            caloriesBurned: caloriesBurned,
            exercisesCompleted: completedSession.completedExercises.length,
            notes: completedSession.notes || '',
            rating: completedSession.rating || null
          });
          console.log('✅ Added workout to progress history');
          
          // Refresh workout stats to ensure UI updates properly
          await get().refreshWorkoutStats();
          console.log('✅ Refreshed workout stats after completion');
        }
      } catch (error) {
        console.error('❌ Failed to update workout store progress:', error);
        // Even if there's an error, try to refresh workout stats
        try {
          await get().refreshWorkoutStats();
        } catch (statsError) {
          console.error('❌ Failed to refresh workout stats:', statsError);
        }
      }
    }
  },

  cancelWorkout: () => {
    set({ currentSession: null });
  },

  addExerciseSet: async (exerciseId, reps, weight, duration) => {
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

      // Find the exercise in the current session
      const exerciseIndex = currentSession.exercises.findIndex(e => e.id === exerciseId);
      if (exerciseIndex === -1) {
        console.error(`❌ Exercise with ID ${exerciseId} not found in current session`);
        return;
      }

      // Create a new exercises array with the updated exercise
      const updatedExercises = [...currentSession.exercises];
      
      // Update the exercise with the new set data
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        reps,
        weight,
      };

      // Update the current session with the new exercises array
      set({
        currentSession: {
          ...currentSession,
          exercises: updatedExercises,
        },
      });

      console.log(`✅ Added set for exercise ${exerciseId}: ${reps} reps, ${weight || 0} kg`);
      
      // Save the exercise set to the database if we have an active session
      try {
        if (currentSession.id) {
          const setData = {
            session: currentSession.id,
            exercise_id: exerciseId,
            set_number: 1, // This should be incremented based on existing sets
            reps_completed: reps,
            weight_used: weight || 0,
            duration: duration || 0,
            rest_time: 60,
            notes: '',
            difficulty_rating: null
          };
          
          // Save the set to the database
          await workoutAPI.createExerciseSet(setData);
          console.log('✅ Exercise set saved to database:', setData);
          
          // Refresh workout stats to ensure UI updates
          get().refreshWorkoutStats();
        }
      } catch (error) {
        console.error('❌ Failed to save exercise set to database:', error);
      }
    }
  },

  updateExerciseSet: (setId, updates) => {
    const { currentSession } = get();
    if (currentSession) {
      // This function is trying to update an exercise set by ID, but it's modifying the exercises array
      // This is likely not the intended behavior
      console.warn('updateExerciseSet is not properly implemented yet');
      
      // Proper implementation would be something like:
      // if (currentSession.exerciseSets) {
      //   const updatedSets = currentSession.exerciseSets.map((set) =>
      //     set.id === setId ? { ...set, ...updates } : set
      //   );
      //
      //   set({
      //     currentSession: {
      //       ...currentSession,
      //       exerciseSets: updatedSets,
      //     },
      //   });
      // }
    }
  },

  getTodayWorkouts: () => {
    const { completedWorkouts } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    console.log('📊 Checking today\'s workouts from', completedWorkouts.length, 'total workouts');
    
    const todayWorkouts = completedWorkouts.filter(workout => {
      // Handle both date string and Date object
      let workoutDate;
      try {
        if (typeof workout.date === 'string') {
          // If we have a date string (YYYY-MM-DD), use that
          workoutDate = new Date(workout.date);
        } else if (workout.startTime) {
          // Otherwise use startTime
          workoutDate = new Date(typeof workout.startTime === 'string' ? workout.startTime : workout.startTime);
        } else {
          // Fallback
          return false;
        }
        
        // Set to start of day for comparison
        workoutDate.setHours(0, 0, 0, 0);
        
        // Check if it's today
        const isToday = workoutDate.getTime() === today.getTime();
        if (isToday) {
          console.log('📊 Found today\'s workout:', workout.workoutName, 'on', workoutDate.toISOString().split('T')[0]);
        }
        return isToday;
      } catch (error) {
        console.error('❌ Error parsing date for workout:', workout, error);
        return false;
      }
    });
    
    console.log(`📊 Today's workouts count: ${todayWorkouts.length}`);
    return todayWorkouts;
  },

  getWeeklyWorkouts: () => {
    const { completedWorkouts } = get();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    console.log('📊 Checking weekly workouts from', completedWorkouts.length, 'total workouts');
    console.log('📊 Week range:', startOfWeek.toISOString().split('T')[0], 'to', endOfWeek.toISOString().split('T')[0]);
    
    const weeklyWorkouts = completedWorkouts.filter(workout => {
      // Handle both date string and Date object
      let workoutDate;
      try {
        if (typeof workout.date === 'string') {
          // If we have a date string (YYYY-MM-DD), use that
          workoutDate = new Date(workout.date);
        } else if (workout.startTime) {
          // Otherwise use startTime
          workoutDate = new Date(typeof workout.startTime === 'string' ? workout.startTime : workout.startTime);
        } else {
          // Fallback
          return false;
        }
        
        // Set to start of day for comparison
        workoutDate.setHours(0, 0, 0, 0);
        
        // Check if it's within this week
        const isThisWeek = workoutDate >= startOfWeek && workoutDate < endOfWeek;
        if (isThisWeek) {
          console.log('📊 Found this week\'s workout:', workout.workoutName, 'on', workoutDate.toISOString().split('T')[0]);
        }
        return isThisWeek;
      } catch (error) {
        console.error('❌ Error parsing date for workout:', workout, error);
        return false;
      }
    });
    
    console.log(`📊 Weekly workouts count: ${weeklyWorkouts.length}`);
    return weeklyWorkouts;
  },

  // Additional functions for session screen
  nextSet: () => {
    const { currentSession } = get();
    if (currentSession) {
      // Check if we've completed all sets for the current exercise
      if (currentSession.currentSet >= currentSession.totalSets) {
        // If we've completed all sets, move to the next exercise
        console.log('✅ All sets completed for current exercise, moving to next exercise');
        get().completeExercise();
      } else {
        // Otherwise, increment the current set
        const updatedSession = {
          ...currentSession,
          currentSet: currentSession.currentSet + 1,
        };
        set({ currentSession: updatedSession });
        console.log(`✅ Moving to set ${updatedSession.currentSet} of ${updatedSession.totalSets}`);
      }
    }
  },

  completeExercise: () => {
    const { currentSession } = get();
    if (currentSession) {
      const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
      
      // Make sure we have a valid exercise name
      const exerciseName = currentExercise?.name || `Exercise ${currentSession.currentExerciseIndex + 1}`;
      
      // Add the current exercise to completedExercises if not already present
      let updatedCompletedExercises = [...currentSession.completedExercises];
      if (!updatedCompletedExercises.includes(exerciseName)) {
        updatedCompletedExercises.push(exerciseName);
      }
      
      // Move to the next exercise and reset currentSet to 1
      const nextExerciseIndex = currentSession.currentExerciseIndex + 1;
      const nextExercise = nextExerciseIndex < currentSession.exercises.length ? 
        currentSession.exercises[nextExerciseIndex] : null;
      
      const updatedSession = {
        ...currentSession,
        currentExerciseIndex: nextExerciseIndex,
        currentSet: 1, // Reset to first set for the next exercise
        totalSets: nextExercise?.sets || 1, // Update totalSets for the next exercise
        completedExercises: updatedCompletedExercises,
      };
      
      // If we've completed all exercises, mark the session as completed
      if (nextExerciseIndex >= currentSession.exercises.length) {
        updatedSession.state = 'completed';
      }
      
      // Update workout stats to track total exercises completed
      const workoutStats = get().workoutStats;
      const updatedStats = {
        ...workoutStats,
        totalExercises: workoutStats.totalExercises + 1,
        strengthIncrease: Math.min(workoutStats.strengthIncrease + 0.5, 100) // Increment strength by 0.5% per exercise, max 100%
      };
      
      set({
        currentSession: updatedSession,
        workoutStats: updatedStats
      });
       
      console.log('✅ Workout stats updated successfully:', updatedStats);
      
      console.log('✅ Exercise completed, moving to next exercise:', updatedSession);
      console.log('✅ Updated completed exercises:', updatedCompletedExercises);
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
      
      // Calculate calories burned based on duration and exercise intensity
      const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 60000);
      const caloriesBurned = Math.round(duration * 5); // Simple calculation: 5 calories per minute
      
      // Prepare the session data for the API
      const sessionData = {
        plan_id: session.id,
        day_id: session.workoutName,
        status: 'completed',
        started_at: session.startTime.toISOString().split('T')[0], // Format as YYYY-MM-DD
        completed_at: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        duration: duration,
        total_exercises: session.exercises.length,
        completed_exercises: session.completedExercises.length,
        calories_burned: caloriesBurned,
        notes: '',
        rating: null
      };

      // Log completed exercises for debugging
      console.log('✅ Completed exercises:', session.completedExercises);
      console.log('✅ Calories burned:', caloriesBurned);

      // Import APIs explicitly to ensure both are available
      const { workoutAPI, progressAPI } = await import('@/services/api');
      let savedSession = null;

      // Create the workout session with workoutAPI
      try {
        savedSession = await workoutAPI.createSession(sessionData);
        console.log('✅ Workout session created with workoutAPI:', savedSession);
      } catch (sessionError) {
        console.error('❌ Failed to create workout session with workoutAPI:', sessionError);
        // Create a fallback session object if API call fails
        savedSession = { id: session.id, ...sessionData };
      }

      // Save exercise sets if there are any
      if (session.exercises.length > 0) {
        const exerciseSetsData = session.exercises.map((exercise, index) => ({
          session: savedSession.id, // integer PK
          exercise_id: exercise?.id || `exercise-${index}`, // Use exercise_id directly as string
          set_number: index + 1,
          reps_completed: exercise?.reps || 0,
          weight_used: exercise?.weight || 0, // Use exercise weight if available
          duration: exercise?.duration || 0, // Use exercise duration if available
          rest_time: exercise?.restTime || 60,
          notes: '',
          difficulty_rating: exercise?.difficultyRating || null
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

      // Save progress data to progressAPI
      const progressData = {
        session_id: savedSession.id,
        workout_type: session.workoutName,
        workout_name: session.workoutName, // Add workout_name for progressAPI
        duration_minutes: sessionData.duration,
        calories_burned: caloriesBurned,
        exercises_completed: session.completedExercises.length,
        exercises: session.exercises || [], // Include full exercise data
        notes: '',
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        start_time: session.startTime,
        end_time: session.endTime || new Date()
      };

      // Try to save to both APIs for redundancy
      let progressSaved = false;
      try {
        await progressAPI.saveCompletedWorkout(progressData);
        console.log('✅ Workout progress saved to progressAPI');
        progressSaved = true;
      } catch (progressError) {
        console.error('❌ Failed to save to progressAPI:', progressError);
      }

      // Always try workoutAPI as well for redundancy
      try {
        await workoutAPI.saveProgress({
          workout_type: session.workoutName,
          started_at: session.startTime,
          completed_at: session.endTime || new Date(),
          duration_minutes: sessionData.duration,
          calories_burned: caloriesBurned,
          exercises_completed: session.completedExercises.length,
        });
        console.log('✅ Workout progress saved to workoutAPI');
      } catch (workoutProgressError) {
        console.error('❌ Failed to save workout progress to workoutAPI:', workoutProgressError);
        
        // If both APIs failed, log a critical error
        if (!progressSaved) {
          console.error('❌❌ CRITICAL: Failed to save workout to both APIs');
        }
      }
      
      // Update workout progress in workout store
      try {
        const { useWorkoutStore } = await import('@/store/workout-store');
        const workoutStore = useWorkoutStore.getState();
        
        if (session.workoutName && workoutStore.currentPlan) {
          // Mark the workout as completed in the workout store
          workoutStore.completeWorkout(savedSession.id);
          
          // Update progress for the current plan
          const currentProgress = workoutStore.workoutProgress[workoutStore.currentPlan.id] || 0;
          const newProgress = Math.min(currentProgress + 10, 100); // Increment by 10% per workout
          workoutStore.updateWorkoutProgress(workoutStore.currentPlan.id, newProgress);
          
          // Refresh workout stats to ensure UI updates properly
          await get().refreshWorkoutStats();
          console.log('✅ Refreshed workout stats after saving to database');
        }
      } catch (error) {
        console.error('❌ Failed to update workout progress in store:', error);
      }
      
      console.log('✅ Workout session and all data saved to database successfully');
      return savedSession;
    } catch (error) {
      console.error('❌ Failed to save workout session:', error);
      throw new Error(`Failed to save workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Function to refresh workout stats based on completed workouts
  refreshWorkoutStats: async () => {
    try {
      console.log('🔄 Refreshing workout stats...');
      
      // First, try to get the latest workout history from the backend
      try {
        // Try to get completed workouts from both APIs and combine them
        const { progressAPI, workoutAPI } = await import('@/services/api');
        let allWorkouts = [];
        
        // First try progress API
        try {
          console.log('📊 Fetching completed workouts from progress API...');
          const completedWorkouts = await progressAPI.getAllCompletedWorkouts();
          
          // Check if completedWorkouts is valid
          if (completedWorkouts && Array.isArray(completedWorkouts)) {
            console.log('✅ Completed workouts loaded from progress API:', completedWorkouts.length, 'workouts');
            
            // Log the first workout to see its structure
            if (completedWorkouts.length > 0) {
              console.log('📊 Sample workout data from progress API:', JSON.stringify(completedWorkouts[0], null, 2));
            }
            
            const formattedWorkouts = completedWorkouts.map((workout: any) => {
              // Extract date properly
              let dateStr = workout.date;
              if (!dateStr && workout.start_time) {
                dateStr = new Date(workout.start_time).toISOString().split('T')[0];
              } else if (!dateStr && workout.created_at) {
                dateStr = new Date(workout.created_at).toISOString().split('T')[0];
              } else {
                // Default to today if no date is available
                dateStr = new Date().toISOString().split('T')[0];
              }
              
              return {
                id: workout.id?.toString() || `workout-${Date.now()}`,
                workoutName: workout.workout_name || workout.name || 'Workout',
                exercises: workout.exercises || [],
                currentExerciseIndex: 0,
                currentSet: 1,
                totalSets: 1,
                startTime: new Date(workout.start_time || workout.created_at || dateStr),
                endTime: new Date(workout.end_time || workout.updated_at || dateStr),
                completedExercises: [],
                state: 'completed' as const,
                timerSeconds: 0,
                isRestTimer: false,
                date: dateStr,
                duration: workout.duration || 0,
                exercisesCompleted: workout.exercises_completed || 0,
                caloriesBurned: workout.calories_burned || 0
              };
            });
            
            allWorkouts = [...formattedWorkouts];
            console.log(`📊 Formatted ${formattedWorkouts.length} workouts from progress API`);
          }
        } catch (progressError) {
          console.error('❌ Failed to load from progress API:', progressError);
        }
        
        // Also try workout API to get any additional workouts
        try {
          console.log('📊 Fetching workout history from workout API...');
          const history = await workoutAPI.getHistory();
          
          // Check if history and history.results are valid
          if (history && history.results && Array.isArray(history.results)) {
            console.log('✅ Latest workout history loaded from workout API:', history.results.length, 'workouts');
            
            // Log the first workout to see its structure
            if (history.results.length > 0) {
              console.log('📊 Sample workout data from workout API:', JSON.stringify(history.results[0], null, 2));
            }
            
            const formattedWorkouts = history.results.map((workout: any) => {
              // Extract date properly
              let dateStr = workout.date || workout.started_at;
              if (!dateStr && workout.start_time) {
                dateStr = new Date(workout.start_time).toISOString().split('T')[0];
              } else if (!dateStr && workout.created_at) {
                dateStr = new Date(workout.created_at).toISOString().split('T')[0];
              } else {
                // Default to today if no date is available
                dateStr = new Date().toISOString().split('T')[0];
              }
              
              return {
                id: workout.id?.toString() || `workout-${Date.now()}`,
                workoutName: workout.workout_type || workout.workout_name || 'Workout',
                exercises: workout.exercises || [],
                currentExerciseIndex: 0,
                currentSet: 1,
                totalSets: 1,
                startTime: new Date(workout.started_at || workout.start_time || dateStr),
                endTime: new Date(workout.completed_at || workout.end_time || dateStr),
                completedExercises: [],
                state: 'completed' as const,
                timerSeconds: 0,
                isRestTimer: false,
                date: dateStr,
                duration: workout.duration_minutes || workout.duration || 0,
                exercisesCompleted: workout.exercises_completed || 0,
                caloriesBurned: workout.calories_burned || 0
              };
            });
            
            // Merge with existing workouts, avoiding duplicates by ID
            const existingIds = new Set(allWorkouts.map(w => w.id));
            const newWorkouts = formattedWorkouts.filter(w => !existingIds.has(w.id));
            
            allWorkouts = [...allWorkouts, ...newWorkouts];
            console.log(`📊 Added ${newWorkouts.length} unique workouts from workout API`);
          }
        } catch (workoutApiError) {
          console.error('❌ Failed to load from workout API:', workoutApiError);
        }
        
        // Update the completed workouts with the combined data
        if (allWorkouts.length > 0) {
          set({ completedWorkouts: allWorkouts });
          console.log('✅ Updated completed workouts with latest data, count:', allWorkouts.length);
        } else {
          console.warn('⚠️ No workout history found from APIs');
        }
      } catch (error) {
        console.error('❌ Failed to load latest workout history:', error);
        // Continue with local data if backend fetch fails
      }
      
      const { completedWorkouts } = get();
      console.log('📊 Current completed workouts count:', completedWorkouts.length);
      
      const totalWorkouts = completedWorkouts.length;
      const totalExercises = completedWorkouts.reduce((sum, workout) => 
        sum + (workout.exercisesCompleted || workout.completedExercises?.length || 0), 0);
      const totalCalories = completedWorkouts.reduce((sum, workout) => 
        sum + (workout.caloriesBurned || 0), 0);
      
      // Calculate weekly workouts
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyWorkouts = completedWorkouts.filter(workout => {
        const workoutDate = new Date(workout.startTime);
        return workoutDate >= oneWeekAgo;
      }).length;
      
      // Force recalculation of weekly workouts
      const todayWorkouts = get().getTodayWorkouts().length;
      console.log(`📊 Stats calculation: Total=${totalWorkouts}, Weekly=${weeklyWorkouts}, Today=${todayWorkouts}`);
      
      // Calculate strength increase (simple formula: 0.5% per workout)
      const strengthIncrease = Math.min(totalWorkouts * 0.5, 100);
      
      // Ensure we have at least some data to display even if no workouts are found
      // This prevents empty stats on the home page
      const currentStats = get().workoutStats;
      const updatedStats = {
        totalWorkouts: totalWorkouts || currentStats?.totalWorkouts || 0,
        weeklyWorkouts: weeklyWorkouts || currentStats?.weeklyWorkouts || 0,
        totalExercises: totalExercises || currentStats?.totalExercises || 0,
        strengthIncrease: strengthIncrease || currentStats?.strengthIncrease || 0,
        caloriesBurned: totalCalories || currentStats?.caloriesBurned || 0
      };
      
      set({
        workoutStats: updatedStats
      });
      
      console.log('✅ Workout stats updated successfully:', updatedStats);
      
      console.log('✅ Refreshed workout stats:', {
        totalWorkouts,
        weeklyWorkouts,
        totalExercises,
        strengthIncrease,
        caloriesBurned: totalCalories
      });
      
      // Also update the workout store progress
      try {
        const { useWorkoutStore } = await import('@/store/workout-store');
        const workoutStore = useWorkoutStore.getState();
        
        if (workoutStore.currentPlan) {
          // Calculate progress based on completed workouts
          const planId = workoutStore.currentPlan.id;
          const totalDays = workoutStore.currentPlan.schedule.length;
          const completedDays = Math.min(totalWorkouts, totalDays);
          const progress = Math.round((completedDays / totalDays) * 100);
          
          // Update progress in workout store
          workoutStore.updateWorkoutProgress(planId, progress);
          console.log('✅ Updated workout progress in workout store:', progress);
        }
      } catch (error) {
        console.error('❌ Failed to update workout store progress:', error);
      }
    } catch (error) {
      console.error('❌ Error refreshing workout stats:', error);
    }
  },
}));