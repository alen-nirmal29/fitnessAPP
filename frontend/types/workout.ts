import { SpecificGoal } from './user';

export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutDuration = '1_month' | '3_month' | '6_month' | '1_year';

// Make both reps and duration optional but at least one is required
export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  sets: number;
  restTime: number; // in seconds
  imageUrl?: string;
  videoUrl?: string;
} & (
  | { reps: number; duration?: never; }
  | { duration: number; reps?: never; }
  | { reps: number; duration: number; }
);

export type WorkoutDay = {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  restDay: boolean;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  duration: WorkoutDuration;
  specificGoal: SpecificGoal;
  schedule: WorkoutDay[];
  isAIGenerated: boolean;
  exercises?: Exercise[]; // Optional array of exercises for the entire plan
};