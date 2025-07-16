import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, Award, TrendingUp, Calendar, Clock, Target, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Body3DModel from '@/components/Body3DModel';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { useWorkoutSessionStore } from '@/store/workout-session-store';
import { defaultWorkouts } from '@/constants/workouts';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { currentPlan, setCurrentPlan } = useWorkoutStore();
  const { workoutStats, getTodayWorkouts } = useWorkoutSessionStore();
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Move setCurrentPlan to useEffect to avoid state update during render
  useEffect(() => {
    if (!currentPlan) {
      const goalBasedWorkout = defaultWorkouts.find(w => w.specificGoal === user?.specificGoal);
      const workout = goalBasedWorkout || defaultWorkouts[0];
      setCurrentPlan(workout);
    }
  }, [currentPlan, user?.specificGoal, setCurrentPlan]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGoalText = () => {
    if (!user?.specificGoal) return 'Set your fitness goals';
    
    switch (user.specificGoal) {
      case 'increase_strength':
        return 'Increase Strength';
      case 'build_muscle':
        return 'Build Muscle';
      case 'weight_loss':
        return 'Weight Loss';
      case 'weight_gain':
        return 'Weight Gain';
      case 'personal_training':
        return 'Personal Training';
      default:
        return 'Your Fitness Journey';
    }
  };

  // Get today's workout - use current plan or default workout
  const getTodaysWorkout = () => {
    if (currentPlan && currentPlan.schedule.length > 0) {
      return currentPlan.schedule[0];
    }
    const goalBasedWorkout = defaultWorkouts.find(w => w.specificGoal === user?.specificGoal);
    const workout = goalBasedWorkout || defaultWorkouts[0];
    return workout.schedule[0];
  };
  const todaysWorkout = getTodaysWorkout();

  const handleStartWorkout = () => {
    if (todaysWorkout && !todaysWorkout.restDay) {
      router.push('/workout/session');
    }
  };

  const handleCreateWorkoutPlan = () => {
    router.push('/workout/plan-selection');
  };

  const handleViewComparison = () => {
    setShowComparisonModal(true);
  };

  // Calculate weekly progress based on real data
  const weeklyProgress = Math.min(workoutStats.weeklyWorkouts / 7, 1); // Assuming 7 workouts per week goal
  const todayWorkouts = getTodayWorkouts();

  // Mock goal measurements for demonstration
  const goalMeasurements = {
    chest: 55,
    waist: 45,
    hips: 50,
    arms: 55,
    legs: 55,
    shoulders: 55,
  };

  // Get screen dimensions for modal model sizing
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const modelWidth = Math.min(screenWidth * 0.9, 400);
  const modelHeight = Math.min(screenHeight * 0.6, 400);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Current Goal</Text>
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>{getGoalText()}</Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Weekly Progress</Text>
          <ProgressBar progress={weeklyProgress} showPercentage />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>{workoutStats.weeklyWorkouts}/7</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={styles.statItem}>
            <Dumbbell size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>{workoutStats.totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>+{workoutStats.strengthIncrease}%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Today's Workout</Text>
      
      {todaysWorkout ? (
        <Card style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>{todaysWorkout.name}</Text>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>45 min</Text>
            </View>
          </View>
          
          <Text style={styles.workoutDescription}>
            {todaysWorkout.restDay 
              ? 'Take a well-deserved rest day to recover'
              : `${todaysWorkout.exercises.length} exercises planned for today`
            }
          </Text>
          
          {!todaysWorkout.restDay && (
            <>
              <View style={styles.exerciseList}>
                {todaysWorkout.exercises.slice(0, 3).map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <Dumbbell size={16} color={Colors.dark.accent} />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>{exercise.sets} × {exercise.reps}</Text>
                  </View>
                ))}
                {todaysWorkout.exercises.length > 3 && (
                  <Text style={styles.moreExercises}>
                    +{todaysWorkout.exercises.length - 3} more exercises
                  </Text>
                )}
              </View>
              
              <Button
                title={todayWorkouts.length > 0 ? "Start Another Workout" : "Start Workout"}
                onPress={handleStartWorkout}
                variant="primary"
                style={styles.startButton}
              />
            </>
          )}
          
          {todayWorkouts.length > 0 && (
            <View style={styles.todayStats}>
              <Text style={styles.todayStatsTitle}>Today's Progress</Text>
              <Text style={styles.todayStatsText}>
                ✅ {todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''} completed
              </Text>
              <Text style={styles.todayStatsText}>
                🔥 {todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0)} calories burned
              </Text>
            </View>
          )}
        </Card>
      ) : (
        <Card style={styles.emptyWorkoutCard}>
          <Award size={40} color={Colors.dark.accent} />
          <Text style={styles.emptyWorkoutTitle}>No Workout Scheduled</Text>
          <Text style={styles.emptyWorkoutText}>
            You don't have any workouts scheduled for today. Take a rest or create a new workout plan.
          </Text>
          <Button
            title="Create Workout Plan"
            onPress={handleCreateWorkoutPlan}
            variant="outline"
            style={styles.createButton}
          />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Body Transformation</Text>
      <Card style={styles.transformationCard}>
        <Text style={styles.transformationText}>
          Track your progress and see how your body transforms over time
        </Text>
        <View style={styles.verticalModels}>
          <Text style={styles.modelLabel}>Current</Text>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%', height: 350, marginVertical: 12, alignSelf: 'center' }}>
            <Body3DModel gender={user?.gender === 'female' ? 'female' : 'male'} />
          </Animated.View>
          <Text style={styles.modelLabel}>Goal</Text>
          <Human2DModel 
            user={user}
            goalMeasurements={goalMeasurements}
            interactive={false}
            style={styles.modelNormal}
          />
        </View>
        <Button
          title="View Full Comparison"
          onPress={handleViewComparison}
          variant="outline"
          style={styles.viewButton}
        />
      </Card>

      <Modal
        visible={showComparisonModal}
        onRequestClose={() => setShowComparisonModal(false)}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeaderFixed}>
            <TouchableOpacity style={styles.modalCloseButtonTop} onPress={() => setShowComparisonModal(false)}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Front View</Text>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent} bounces={false}>
            <View style={{ width: '95%', alignItems: 'flex-start', marginTop: 40, marginBottom: 16, alignSelf: 'center', height: 700, backgroundColor: '#181C22', borderRadius: 24, padding: 12, paddingTop: 180 }}>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%', height: 400, alignSelf: 'center' }}>
                <Body3DModel gender={user?.gender === 'female' ? 'female' : 'male'} />
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  goalBadge: {
    backgroundColor: 'rgba(59, 95, 227, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.subtext,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  workoutCard: {
    marginBottom: 24,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  workoutBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: Colors.dark.gradient.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  exerciseList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 8,
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  moreExercises: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontStyle: 'italic',
    marginTop: 4,
  },
  startButton: {
    marginTop: 8,
  },
  todayStats: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  todayStatsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.success,
    marginBottom: 4,
  },
  todayStatsText: {
    fontSize: 12,
    color: Colors.dark.success,
    marginBottom: 2,
  },
  emptyWorkoutCard: {
    marginBottom: 24,
    alignItems: 'center',
    padding: 24,
  },
  emptyWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyWorkoutText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 8,
  },
  transformationCard: {
    marginBottom: 24,
    minHeight: 600, // Increased height for more space
    paddingVertical: 32, // More vertical padding
    paddingHorizontal: 16, // Add horizontal padding for balance
    justifyContent: 'center', // Center content vertically
  },
  transformationText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  viewButton: {
    marginTop: 16,
  },
  modelContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modelWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  smallModel: {
    width: '100%',
    height: 150, // Reduced height for smaller models
    transform: [{ scale: 0.8 }], // Scale down the models
  },
  fullModel: {
    width: '90%',
    maxWidth: 400,
    height: '70%',
    maxHeight: 500,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 0,
  },
  modalHeaderFixed: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(20,20,20,0.95)',
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  modalCloseButtonTop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
    marginRight: 12,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
  },
  modalScrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 32,
    width: '100%',
  },
  modalModelContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modelNormal: {
    width: 340,
    height: 500, // Increased height for a larger model
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center', // Already centers horizontally, keep for clarity
  },
  modelLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    gap: 8,
  },
  comparisonModelContainer: {
    alignItems: 'center',
    width: '45%',
  },
  comparisonModel: {
    width: '100%',
    aspectRatio: 0.7,
    maxWidth: 180,
    maxHeight: 400,
  },
  comparisonLabel: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});