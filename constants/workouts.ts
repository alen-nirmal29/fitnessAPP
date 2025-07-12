import { WorkoutPlan } from '@/types/workout';

export const defaultWorkouts: WorkoutPlan[] = [
  {
    id: 'default-1',
    name: 'Upper Body Strength',
    description: 'Focus on chest, shoulders, and arms',
    difficulty: 'intermediate',
    duration: '1_month',
    specificGoal: 'increase_strength',
    isAIGenerated: false,
    schedule: [
      {
        id: 'day-1',
        name: 'Upper Body Strength',
        exercises: [
          {
            id: 'ex-1',
            name: 'Push-ups',
            description: 'Standard push-ups for chest and triceps',
            muscleGroup: 'chest',
            sets: 3,
            reps: 12,
            restTime: 60,
          },
          {
            id: 'ex-2',
            name: 'Pull-ups',
            description: 'Pull your body up to the bar',
            muscleGroup: 'back',
            sets: 3,
            reps: 8,
            restTime: 90,
          },
          {
            id: 'ex-3',
            name: 'Shoulder Press',
            description: 'Press weights overhead',
            muscleGroup: 'shoulders',
            sets: 3,
            reps: 10,
            restTime: 75,
          },
          {
            id: 'ex-4',
            name: 'Bicep Curls',
            description: 'Curl weights to work biceps',
            muscleGroup: 'arms',
            sets: 3,
            reps: 12,
            restTime: 60,
          }
        ],
        restDay: false,
      }
    ],
  },
  {
    id: 'default-2',
    name: 'Lower Body Power',
    description: 'Focus on legs and glutes',
    difficulty: 'intermediate',
    duration: '1_month',
    specificGoal: 'build_muscle',
    isAIGenerated: false,
    schedule: [
      {
        id: 'day-2',
        name: 'Lower Body Power',
        exercises: [
          {
            id: 'ex-5',
            name: 'Squats',
            description: 'Bend knees and lower body, then rise',
            muscleGroup: 'legs',
            sets: 4,
            reps: 12,
            restTime: 90,
          },
          {
            id: 'ex-6',
            name: 'Lunges',
            description: 'Step forward and lower body',
            muscleGroup: 'legs',
            sets: 3,
            reps: 10,
            restTime: 75,
          },
          {
            id: 'ex-7',
            name: 'Calf Raises',
            description: 'Rise up on your toes',
            muscleGroup: 'legs',
            sets: 3,
            reps: 15,
            restTime: 45,
          }
        ],
        restDay: false,
      }
    ],
  },
  {
    id: 'default-3',
    name: 'Full Body Conditioning',
    description: 'Complete body workout for overall fitness',
    difficulty: 'beginner',
    duration: '1_month',
    specificGoal: 'weight_loss',
    isAIGenerated: false,
    schedule: [
      {
        id: 'day-3',
        name: 'Full Body Conditioning',
        exercises: [
          {
            id: 'ex-8',
            name: 'Burpees',
            description: 'Full body conditioning exercise',
            muscleGroup: 'full_body',
            sets: 3,
            reps: 10,
            restTime: 60,
          },
          {
            id: 'ex-9',
            name: 'Mountain Climbers',
            description: 'Dynamic core exercise',
            muscleGroup: 'core',
            sets: 3,
            reps: 20,
            restTime: 45,
          },
          {
            id: 'ex-10',
            name: 'Jumping Jacks',
            description: 'Cardiovascular exercise',
            muscleGroup: 'cardio',
            sets: 3,
            reps: 30,
            restTime: 30,
          }
        ],
        restDay: false,
      }
    ],
  }
];

export const defaultExercises = [
  {
    id: 'ex-1',
    name: 'Push-ups',
    description: 'Standard push-ups for chest and triceps',
    muscleGroup: 'chest',
    sets: 3,
    reps: 12,
    restTime: 60,
  },
  {
    id: 'ex-2',
    name: 'Squats',
    description: 'Bend knees and lower body, then rise',
    muscleGroup: 'legs',
    sets: 3,
    reps: 15,
    restTime: 60,
  },
  {
    id: 'ex-3',
    name: 'Plank',
    description: 'Hold plank position for core strength',
    muscleGroup: 'core',
    sets: 3,
    reps: 30,
    restTime: 45,
  }
]; 