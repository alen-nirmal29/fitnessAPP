import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Dumbbell, Award, TrendingUp, Calendar, Clock, Target, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
// Removed Body3DModel import
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { useWorkoutSessionStore } from '@/store/workout-session-store';
import { getAllPredefinedPlans } from '@/constants/workouts';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { currentPlan, setCurrentPlan, loadUserPlans } = useWorkoutStore();
  const { workoutStats, getTodayWorkouts, getWeeklyWorkouts } = useWorkoutSessionStore();
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Debug logging
  console.log('🏠 Home Screen Debug:');
  console.log('👤 User:', user);
  console.log('👤 User name:', user?.name);
  console.log('👤 User first_name:', user?.first_name);
  console.log('👤 User email:', user?.email);
  console.log('📋 Current Plan:', currentPlan);
  console.log('📋 Current Plan type:', typeof currentPlan);
  console.log('📋 Current Plan keys:', currentPlan ? Object.keys(currentPlan) : 'null');
  console.log('🎯 User specific goal:', user?.specificGoal);
  console.log('🎯 User fitness goal:', user?.fitnessGoal);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Load workout history from backend when component mounts
  React.useEffect(() => {
    const loadWorkoutHistory = async () => {
      try {
        console.log('📊 Loading workout history for home screen...');
        
        // Get the session store and refresh workout stats
        const { useWorkoutSessionStore } = await import('@/store/workout-session-store');
        const sessionStore = useWorkoutSessionStore.getState();
        
        // This will fetch the latest workout history from the backend
        // and update the local state with the latest data
        await sessionStore.refreshWorkoutStats();
        
        // Log the current workout stats after refresh
        console.log('📊 Home screen - Current workout stats after refresh:', sessionStore.workoutStats);
        console.log('📊 Home screen - Completed workouts count:', sessionStore.completedWorkouts.length);
        console.log('📊 Home screen - Today\'s workouts:', sessionStore.getTodayWorkouts().length);
        console.log('📊 Home screen - Weekly workouts:', sessionStore.getWeeklyWorkouts().length);
        
        // Also refresh the workout store data
        const { useWorkoutStore } = await import('@/store/workout-store');
        const workoutStore = useWorkoutStore.getState();
        
        // Load user plans if needed
        if (!workoutStore.currentPlan) {
          await workoutStore.loadUserPlans();
        }
        
        console.log('✅ Workout history loaded for home screen');
      } catch (error) {
        console.error('❌ Failed to load workout history for home:', error);
      }
    };
    
    loadWorkoutHistory();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          console.log('🔄 Refreshing workout data on home screen focus...');
          
          // Get the session store and refresh workout stats
          const { useWorkoutSessionStore } = await import('@/store/workout-session-store');
          const sessionStore = useWorkoutSessionStore.getState();
          
          // This will fetch the latest workout history from the backend
          // and update the local state with the latest data
          await sessionStore.refreshWorkoutStats();
          
          // Log the refreshed stats
          console.log('📊 Home screen focus - Refreshed workout stats:', sessionStore.workoutStats);
          console.log('📊 Home screen focus - Today\'s workouts:', sessionStore.getTodayWorkouts().length);
          console.log('📊 Home screen focus - Weekly workouts:', sessionStore.getWeeklyWorkouts().length);
          
          // Also refresh the workout store data
          const { useWorkoutStore } = await import('@/store/workout-store');
          const workoutStore = useWorkoutStore.getState();
          
          // Load user plans if needed
          if (!workoutStore.currentPlan) {
            await workoutStore.loadUserPlans();
          }
          
          console.log('✅ Refreshed workout data on home screen focus');
        } catch (error) {
          console.error('❌ Failed to refresh workout data:', error);
        }
      };
      
      refreshData();
    }, [])
  );

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
    console.log('🔄 Home Screen useEffect triggered');
    console.log('📋 Current plan exists:', !!currentPlan);
    console.log('👤 User specific goal:', user?.specificGoal);
    
    if (!currentPlan) {
      console.log('📋 No current plan, setting one...');
      const allPlans = getAllPredefinedPlans();
      console.log('📊 Total predefined plans:', allPlans.length);
      
      // If user has no specific goal, default to 'build_muscle'
      const userGoal = user?.specificGoal || 'build_muscle';
      console.log('🎯 Using goal:', userGoal);
      
      const goalBasedWorkout = allPlans.find(w => w.specificGoal === userGoal);
      console.log('🎯 Goal-based workout found:', !!goalBasedWorkout);
      
      const workout = goalBasedWorkout || allPlans[0];
      console.log('📋 Selected workout:', workout?.name);
      
      if (workout) {
        console.log('✅ Setting current plan:', workout.name);
        setCurrentPlan(workout);
      } else {
        console.log('❌ No workout plan available');
      }
    }
  }, [currentPlan, user?.specificGoal, setCurrentPlan]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = () => {
    const displayName = user?.name || user?.first_name || 'User';
    console.log('👤 Display name:', displayName);
    return displayName;
  };

  const getTodayWorkoutsCount = () => {
    const todayWorkouts = getTodayWorkouts();
    console.log('🏠 Today\'s workouts on home screen:', todayWorkouts.length);
    return todayWorkouts.length;
  };

  const getWeeklyWorkoutsCount = () => {
    const weeklyWorkouts = getWeeklyWorkouts();
    console.log('🏠 Weekly workouts on home screen:', weeklyWorkouts.length);
    return weeklyWorkouts.length;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {getUserDisplayName()}!</Text>
            <Text style={styles.subtitle}>Ready to crush your fitness goals?</Text>
          </View>
        </View>

        {/* 3D Body Model */}
        <View style={styles.modelContainer}>
          {/* Body3DModel component removed */}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Dumbbell size={24} color={Colors.dark.accent} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  {workoutStats ? getTodayWorkoutsCount() : '...'}
                </Text>
                <Text style={styles.statLabel}>Today's Workouts</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Calendar size={24} color={Colors.dark.gradient.primary} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  {workoutStats ? getWeeklyWorkoutsCount() : '...'}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Current Plan */}
        {currentPlan && typeof currentPlan === 'object' ? (
          <Card style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Current Plan</Text>
              <TouchableOpacity onPress={() => router.push('/workout/plan-selection')}>
                <Text style={styles.changePlanText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.planName}>{currentPlan.name || 'Unnamed Plan'}</Text>
            <Text style={styles.planDescription}>{currentPlan.description || 'No description available'}</Text>
            <View style={styles.planStats}>
              <View style={styles.planStat}>
                <Clock size={16} color={Colors.dark.subtext} />
                <Text style={styles.planStatText}>{currentPlan.duration || 'Unknown duration'}</Text>
              </View>
              <View style={styles.planStat}>
                <Target size={16} color={Colors.dark.subtext} />
                <Text style={styles.planStatText}>{(currentPlan.specificGoal || 'Unknown goal').replace('_', ' ')}</Text>
              </View>
            </View>
            <Button
              title="Start Workout"
              onPress={() => router.push('/workout/session')}
              style={styles.startWorkoutButton}
            />
          </Card>
        ) : (
          <Card style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Current Plan</Text>
              <TouchableOpacity onPress={() => router.push('/workout/plan-selection')}>
                <Text style={styles.changePlanText}>Select Plan</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.planName}>No Plan Selected</Text>
            <Text style={styles.planDescription}>Choose a workout plan to get started</Text>
            <Button
              title="Select Plan"
              onPress={() => router.push('/workout/plan-selection')}
              style={styles.startWorkoutButton}
            />
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/workout/plan-generator')}
          >
            <Award size={24} color={Colors.dark.accent} />
            <Text style={styles.actionText}>Generate Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <TrendingUp size={24} color={Colors.dark.gradient.primary} />
            <Text style={styles.actionText}>Track Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Weekly Progress</Text>
          <ProgressBar progress={65} />
          <Text style={styles.progressText}>65% of weekly goal completed</Text>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  modelContainer: {
    height: 250,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.subtext,
  },
  planCard: {
    padding: 20,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  changePlanText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planStatText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  startWorkoutButton: {
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  progressCard: {
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.dark.subtext,
  },
});