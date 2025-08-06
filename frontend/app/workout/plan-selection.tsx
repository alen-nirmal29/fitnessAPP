import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Zap, Target, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Target size={28} color={Colors.dark.gradient.primary} style={styles.titleIcon} />
            <Text style={styles.title}>Choose Your Workout Plan</Text>
          </View>
          <Text style={styles.subtitle}>
            AI-powered recommendations tailored to your body composition and fitness goals
          </Text>
        </View>

        {/* AI Generation Card */}
        <Card style={styles.aiGenerationCard}>
          <View style={styles.aiCardHeader}>
            <View style={styles.aiIconContainer}>
              <Sparkles size={24} color={Colors.dark.gradient.primary} />
            </View>
            <View style={styles.aiCardContent}>
              <Text style={styles.aiCardTitle}>Create Custom AI Plan</Text>
              <Text style={styles.aiCardSubtitle}>
                Generate a completely personalized workout plan based on your unique profile
              </Text>
            </View>
          </View>
          
          <Button
            title="Generate Custom Plan"
            onPress={handleCreateCustomPlan}
            variant="primary"
            size="large"
            style={styles.aiGenerateButton}
            textStyle={styles.aiGenerateButtonText}
            leftIcon={<Zap size={20} color="#fff" />}
          />
        </Card>

        {/* Recommended Plans Section */}
        <View style={styles.plansContainer}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Recommended Plans</Text>
          </View>
          
          <Card style={styles.recommendationCard}>
            <Text style={styles.recommendationNote}>
              Based on your profile: {user?.gender}, {user?.age}y, {user?.height}cm, {user?.weight}kg, {user?.fitnessLevel} level
            </Text>
          </Card>
          
          {isLoading ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator color={Colors.dark.gradient.primary} size="large" />
              <Text style={styles.loadingTitle}>Loading Recommendations</Text>
              <Text style={styles.loadingText}>
                Finding the best workout plans for your profile...
              </Text>
            </Card>
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
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Recommendations Available</Text>
              <Text style={styles.emptyText}>
                Unable to load recommendations right now. Try generating a custom plan instead.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Continue with Selected Plan"
          onPress={handleContinue}
          variant="primary"
          size="large"
          style={styles.continueButton}
          disabled={!selectedPlan}
          leftIcon={selectedPlan ? <Target size={20} color="#fff" /> : undefined}
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
    padding: 20,
    paddingBottom: 140, // Increased padding to account for footer
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  aiGenerationCard: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: 'rgba(123, 44, 191, 0.1)',
    borderColor: Colors.dark.gradient.secondary,
    borderWidth: 1,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(123, 44, 191, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiCardContent: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  aiCardSubtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
  },
  aiGenerateButton: {
    width: '100%',
    minHeight: 56,
  },
  aiGenerateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  plansContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  recommendationCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    borderColor: Colors.dark.accent,
    borderWidth: 1,
  },
  recommendationNote: {
    fontSize: 14,
    color: Colors.dark.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  continueButton: {
    width: '100%',
    minHeight: 56,
  },
});