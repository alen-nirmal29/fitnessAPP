export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutDuration = '1_month' | '3_month' | '6_month' | '1_year';

export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  restTime: number; // in seconds
  imageUrl?: string;
  videoUrl?: string;
};

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
  specificGoal: string;
  schedule: WorkoutDay[];
  isAIGenerated: boolean;
};