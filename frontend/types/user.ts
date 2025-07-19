export type Gender = 'male' | 'female' | 'other';

export type FitnessGoal = 'lose_weight' | 'maintain' | 'gain_weight';

export type SpecificGoal = 
  | 'increase_strength' 
  | 'build_muscle' 
  | 'weight_loss' 
  | 'weight_gain' 
  | 'personal_training';

export type BodyComposition = {
  bodyFat?: number;
  muscleMass?: number;
  boneMass?: number;
  waterWeight?: number;
  bmr?: number;
  visceralFat?: number;
  proteinMass?: number;
  bmi?: number;
  muscleRate?: number;
  metabolicAge?: number;
  weightWithoutFat?: number;
};

export type BodyMeasurements = {
  chest: number;
  waist: number;
  hips: number;
  arms: number;
  legs: number;
  shoulders: number;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  height?: number; // in cm
  weight?: number; // in kg
  gender?: Gender;
  fitnessGoal?: FitnessGoal;
  specificGoal?: SpecificGoal;
  bodyComposition?: BodyComposition;
  currentMeasurements?: BodyMeasurements;
  goalMeasurements?: BodyMeasurements;
  hasCompletedOnboarding: boolean;
};

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: string | null;
};