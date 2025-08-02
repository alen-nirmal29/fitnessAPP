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
  const { currentPlan, setCurrentPlan, loadUserPlans } = useWorkoutStore();
  const { workoutStats, getTodayWorkouts, getWeeklyWorkouts } = useWorkoutSessionStore();
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
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayWorkoutsCount = () => {
    return getTodayWorkouts().length;
  };

  const getWeeklyWorkoutsCount = () => {
    return getWeeklyWorkouts().length;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'User'}!</Text>
            <Text style={styles.subtitle}>Ready to crush your fitness goals?</Text>
          </View>
        </View>

        {/* 3D Body Model */}
        <View style={styles.modelContainer}>
          <Body3DModel />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Dumbbell size={24} color={Colors.primary} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{getTodayWorkoutsCount()}</Text>
                <Text style={styles.statLabel}>Today's Workouts</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Calendar size={24} color={Colors.success} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{getWeeklyWorkoutsCount()}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Current Plan */}
        {currentPlan && (
          <Card style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Current Plan</Text>
              <TouchableOpacity onPress={() => router.push('/workout/plan-selection')}>
                <Text style={styles.changePlanText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.planName}>{currentPlan.name}</Text>
            <Text style={styles.planDescription}>{currentPlan.description}</Text>
            <View style={styles.planStats}>
              <View style={styles.planStat}>
                <Clock size={16} color={Colors.textSecondary} />
                <Text style={styles.planStatText}>{currentPlan.duration}</Text>
              </View>
              <View style={styles.planStat}>
                <Target size={16} color={Colors.textSecondary} />
                <Text style={styles.planStatText}>{currentPlan.specificGoal?.replace('_', ' ')}</Text>
              </View>
            </View>
            <Button
              title="Start Workout"
              onPress={() => router.push('/workout/session')}
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
            <Award size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Generate Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/progress')}
          >
            <TrendingUp size={24} color={Colors.success} />
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  changePlanText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressCard: {
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});