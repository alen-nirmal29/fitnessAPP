import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import WorkoutPlanCard from '@/components/WorkoutPlanCard';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { WorkoutPlan } from '@/types/workout';

export default function PlanSelectionScreen() {
  const { user } = useAuthStore();
  const { recommendedPlans, getRecommendedPlans, setCurrentPlan, isLoading } = useWorkoutStore();
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    if (user?.specificGoal) {
      // Pass user details to get personalized recommendations
      const userDetails = {
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        fitnessLevel: user.fitnessLevel,
        bodyFat: user.bodyFat,
        currentMeasurements: user.currentMeasurements,
        goalMeasurements: user.goalMeasurements,
      };
      getRecommendedPlans(user.specificGoal, userDetails);
    }
  }, [user?.specificGoal]);

  const handleSelectPlan = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
  };

  const handleCreateCustomPlan = () => {
    router.push('/workout/plan-generator');
  };

  const handleContinue = () => {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan);
      router.push('/workout/plan-details');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a Workout Plan</Text>
          <Text style={styles.subtitle}>
            AI-powered recommendations based on your body composition and goals
          </Text>
        </View>

        <Button
          title="🤖 Generate AI Custom Plan"
          onPress={handleCreateCustomPlan}
          variant="primary"
          size="large"
          style={[styles.customButton, { minWidth: '100%', width: '100%' }]}
          leftIcon={<Plus size={20} color={Colors.dark.background} />}
        />

        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>🎯 AI Recommended Plans</Text>
          <Text style={styles.recommendationNote}>
            Based on your: {user?.gender}, {user?.age}y, {user?.height}cm, {user?.weight}kg, {user?.fitnessLevel} level
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.dark.accent} size="large" />
              <Text style={styles.loadingText}>AI is analyzing your profile...</Text>
            </View>
          ) : recommendedPlans.length > 0 ? (
            recommendedPlans.map((plan) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                onPress={() => handleSelectPlan(plan)}
                isSelected={selectedPlan?.id === plan.id}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              Unable to load AI recommendations right now.
              Try generating a custom AI plan instead.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={!selectedPlan}
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  customButton: {
    marginBottom: 24,
    minWidth: '100%',
    width: '100%',
  },
  plansContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  recommendationNote: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.dark.subtext,
    fontSize: 16,
  },
  emptyText: {
    color: Colors.dark.subtext,
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  button: {
    width: '100%',
  },
});