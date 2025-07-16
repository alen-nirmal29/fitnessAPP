import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Play, Pause, Square, SkipForward, Timer, Dumbbell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { useWorkoutSessionStore } from '@/store/workout-session-store';
import { useWorkoutStore } from '@/store/workout-store';

// Default exercises if no workout plan exists
const defaultExercises = [
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
    name: 'Squats',
    description: 'Bend knees and lower body, then rise',
    muscleGroup: 'legs',
    sets: 4,
    reps: 12,
    restTime: 90,
  },
  {
    id: 'ex-4',
    name: 'Plank',
    description: 'Hold plank position for core strength',
    muscleGroup: 'core',
    sets: 3,
    reps: 30,
    restTime: 60,
  }
];

export default function WorkoutSessionScreen() {
  const { workoutId } = useLocalSearchParams();
  const workoutStore = useWorkoutStore();
  const {
    currentSession,
    startWorkout,
    nextSet,
    completeExercise,
    completeWorkout,
    pauseWorkout,
    resumeWorkout,
    cancelWorkout,
    updateTimer,
  } = useWorkoutSessionStore();
  
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get today's workout or use default
  const getTodaysWorkout = () => {
    if (workoutStore.currentPlan?.schedule && workoutStore.currentPlan.schedule.length > 0) {
      return workoutStore.currentPlan.schedule[0];
    }
    
    // Return default workout
    return {
      id: 'default-workout',
      name: 'Full Body Workout',
      exercises: defaultExercises,
      restDay: false,
    };
  };

  const todayWorkout = getTodaysWorkout();

  useEffect(() => {
    // Start workout if not already started
    if (!currentSession && todayWorkout && !todayWorkout.restDay) {
      startWorkout(todayWorkout.name, todayWorkout.exercises);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && currentSession) {
      interval = setInterval(() => {
        if (currentSession.isRestTimer) {
          // Rest timer counts down
          const newTime = Math.max(0, timer - 1);
          setTimer(newTime);
          updateTimer(newTime);
          
          if (newTime === 0) {
            setIsTimerRunning(false);
          }
        } else {
          // Exercise timer counts up
          const newTime = timer + 1;
          setTimer(newTime);
          updateTimer(newTime);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, currentSession]);

  useEffect(() => {
    if (currentSession) {
      setTimer(currentSession.timerSeconds);
      setIsTimerRunning(currentSession.state === 'active' || currentSession.state === 'resting');
    }
  }, [currentSession]);

  const handleStartPause = () => {
    if (!currentSession) return;
    
    if (currentSession.state === 'active' || currentSession.state === 'resting') {
      pauseWorkout();
      setIsTimerRunning(false);
    } else {
      resumeWorkout();
      setIsTimerRunning(true);
    }
  };

  const handleNextSet = () => {
    if (!currentSession) return;
    
    if (currentSession.isRestTimer) {
      // Skip rest
      setTimer(0);
      setIsTimerRunning(false);
      resumeWorkout();
    } else {
      // Complete set and start rest
      const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
      
      if (currentSession.currentSet < currentSession.totalSets) {
        nextSet();
        setTimer(currentExercise.restTime);
        setIsTimerRunning(true);
      } else {
        // Last set of exercise, complete exercise
        handleCompleteExercise();
      }
    }
  };

  const handleCompleteExercise = () => {
    if (!currentSession) return;
    
    try {
      completeExercise();
      setTimer(0);
      setIsTimerRunning(false);
    } catch (error) {
      console.error('Error completing exercise:', error);
      // If there's an error, still try to complete the workout
      completeWorkout();
    }
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Workout',
          onPress: () => {
            completeWorkout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minsStr = mins < 10 ? '0' + mins : mins.toString();
    const secsStr = secs < 10 ? '0' + secs : secs.toString();
    return `${minsStr}:${secsStr}`;
  };

  if (!currentSession || !todayWorkout) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No workout session found</Text>
          <Button
            title="Go Back"
            onPress={() => router.replace('/(tabs)')}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  const planProgressPercentage = workoutStore.currentPlan ? (workoutStore.workoutProgress[workoutStore.currentPlan.id] || 0) : 0;
  
  if (currentSession.state === 'completed') {
    
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Workout Completed! 🎉</Text>
          <Text style={styles.completedSubtitle}>Great job on finishing your workout!</Text>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Workout Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000)}
                </Text>
                <Text style={styles.summaryStatLabel}>Minutes</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{currentSession.completedExercises.length}</Text>
                <Text style={styles.summaryStatLabel}>Exercises</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000 * 8)}
                </Text>
                <Text style={styles.summaryStatLabel}>Calories</Text>
              </View>
            </View>
          </Card>
          
          {/* Progress Update Card */}
          {workoutStore.currentPlan && planProgressPercentage > 0 && (
            <Card style={styles.progressCard}>
              <Text style={styles.progressTitle}>Plan Progress Updated! 📈</Text>
              <Text style={styles.progressSubtitle}>
                You've completed {Math.round(planProgressPercentage)}% of your {workoutStore.currentPlan.name}
              </Text>
              <ProgressBar progress={planProgressPercentage / 100} height={8} />
              <Text style={styles.progressNote}>
                Check your Progress tab to see your body transformation!
              </Text>
            </Card>
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              title="View Progress"
              onPress={() => router.replace('/(tabs)/progress')}
              variant="outline"
              style={styles.progressButton}
            />
            <Button
              title="Back to Home"
              onPress={() => router.replace('/(tabs)')}
              variant="primary"
              size="large"
              style={styles.backButton}
            />
          </View>
        </View>
      </View>
    );
  }

  const currentExercise = currentSession.exercises[currentSession.currentExerciseIndex];
  const progress = (currentSession.currentExerciseIndex + (currentSession.currentSet / currentSession.totalSets)) / currentSession.exercises.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.workoutTitle}>{currentSession.workoutName}</Text>
          <Text style={styles.workoutProgress}>
            Exercise {currentSession.currentExerciseIndex + 1} of {currentSession.exercises.length}
          </Text>
          <ProgressBar progress={progress} height={8} />
        </View>

        {/* Timer */}
        <Card style={styles.timerCard}>
          <View style={styles.timerContainer}>
            <Timer size={24} color={Colors.dark.accent} />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            <Text style={styles.timerLabel}>
              {currentSession.isRestTimer ? 'Rest Time' : 'Exercise Time'}
            </Text>
          </View>
          
          {currentSession.isRestTimer && (
            <View style={styles.restIndicator}>
              <Text style={styles.restText}>Take a break! Next set starting soon...</Text>
            </View>
          )}
        </Card>

        {/* Current Exercise */}
        <Card style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          </View>
          
          <Text style={styles.exerciseDescription}>{currentExercise.description}</Text>
          
          <View style={styles.exerciseStats}>
            <View style={styles.exerciseStatItem}>
              <Text style={styles.exerciseStatValue}>{currentSession.currentSet}</Text>
              <Text style={styles.exerciseStatLabel}>Current Set</Text>
            </View>
            <View style={styles.exerciseStatItem}>
              <Text style={styles.exerciseStatValue}>{currentSession.totalSets}</Text>
              <Text style={styles.exerciseStatLabel}>Total Sets</Text>
            </View>
            <View style={styles.exerciseStatItem}>
              <Text style={styles.exerciseStatValue}>{currentExercise.reps}</Text>
              <Text style={styles.exerciseStatLabel}>Reps</Text>
            </View>
          </View>
        </Card>

        {/* Controls */}
        <View style={styles.controls}>
          <Button
            title={currentSession.state === 'active' || currentSession.state === 'resting' ? 'Pause' : 'Resume'}
            onPress={handleStartPause}
            variant="outline"
            size="medium"
            style={{ minHeight: 40, paddingVertical: 8, paddingHorizontal: 18, minWidth: 100, maxWidth: 220 }}
            leftIcon={
              currentSession.state === 'active' || currentSession.state === 'resting' ? 
              <Pause size={20} color={Colors.dark.accent} /> : 
              <Play size={20} color={Colors.dark.accent} />
            }
          />
          
          <Button
            title={currentSession.isRestTimer ? 'Skip Rest' : (currentSession.currentSet >= currentSession.totalSets ? 'Complete Exercise' : 'Next Set')}
            onPress={handleNextSet}
            variant="primary"
            size="medium"
            style={{ minHeight: 40, paddingVertical: 8, paddingHorizontal: 18, minWidth: 100, maxWidth: 220 }}
            leftIcon={<SkipForward size={20} color="#fff" />}
          />
        </View>

        {/* Exercise Actions */}
        <View style={styles.actions}>
          <Button
            title="Complete Exercise"
            onPress={handleCompleteExercise}
            variant="outline"
            size="medium"
            style={{ alignSelf: 'center', minHeight: 56, paddingVertical: 8, paddingHorizontal: 18, minWidth: 180, maxWidth: 240 }}
          />
          
          <Button
            title="End Workout"
            onPress={handleEndWorkout}
            variant="outline"
            size="medium"
            style={{ alignSelf: 'center', minHeight: 56, paddingVertical: 8, paddingHorizontal: 18, minWidth: 180, maxWidth: 240 }}
          />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Cancel Workout"
          onPress={handleCancelWorkout}
          variant="text"
          size="medium"
          style={{ minHeight: 40, paddingVertical: 8, paddingHorizontal: 18, minWidth: 100, maxWidth: 220 }}
          leftIcon={<Square size={16} color={Colors.dark.error} />}
          textStyle={{ color: Colors.dark.error }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 18,
    marginBottom: 16,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.accent,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginTop: 4,
  },
  progressCard: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'rgba(59, 95, 227, 0.05)',
    borderColor: 'rgba(59, 95, 227, 0.2)',
    borderWidth: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.accent,
    marginBottom: 4,
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressNote: {
    fontSize: 12,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  progressButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },
  header: {
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  workoutProgress: {
    fontSize: 16,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  timerCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginVertical: 8,
  },
  timerLabel: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  restIndicator: {
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  restText: {
    color: Colors.dark.accent,
    textAlign: 'center',
    fontSize: 14,
  },
  exerciseCard: {
    marginBottom: 24,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exerciseStatItem: {
    alignItems: 'center',
  },
  exerciseStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.accent,
  },
  exerciseStatLabel: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  controlButton: {
    flex: 1,
  },
  actions: {
    gap: 16,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    minWidth: 160, // ensure enough width for the text
    flexShrink: 1, // allow shrinking to fit container
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 8,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    alignItems: 'center',
  },
});