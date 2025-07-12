import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Dumbbell, Weight, TrendingDown, TrendingUp, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import GoalCard from '@/components/GoalCard';
import { useAuthStore } from '@/store/auth-store';
import { SpecificGoal } from '@/types/user';

export default function SpecificGoalsScreen() {
  const { updateProfile, completeOnboarding, user, setInOnboarding } = useAuthStore();
  const [selectedGoal, setSelectedGoal] = useState<SpecificGoal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Specific goals screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, []);

  const handleNext = async () => {
    console.log('Specific goals handleNext called');
    console.log('Selected goal:', selectedGoal);
    console.log('Current user:', user);
    
    if (selectedGoal) {
      setIsLoading(true);
      
      try {
        console.log('Updating specific goal...');
        
        updateProfile({
          specificGoal: selectedGoal,
        });
        
        console.log('Specific goal updated, completing onboarding...');
        
        completeOnboarding();
        
        console.log('Onboarding completed, navigating to workout plan selection...');
        
        // Navigate to workout plan selection using replace to prevent navigation stack issues
        router.replace('/workout/plan-selection');
        
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    // Use replace to go back to body model page
    router.replace('/onboarding/body-model');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Specific Goals</Text>
          <Text style={styles.subtitle}>What specific fitness goal would you like to focus on?</Text>
        </View>

        <View style={styles.goalsContainer}>
          <GoalCard
            title="Increase Strength"
            description="Focus on building raw strength and power"
            icon={<Dumbbell size={24} color={selectedGoal === 'increase_strength' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'increase_strength'}
            onPress={() => setSelectedGoal('increase_strength')}
          />
          
          <GoalCard
            title="Build Muscle"
            description="Focus on muscle hypertrophy and definition"
            icon={<TrendingUp size={24} color={selectedGoal === 'build_muscle' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'build_muscle'}
            onPress={() => setSelectedGoal('build_muscle')}
          />
          
          <GoalCard
            title="Weight Loss"
            description="Focus on fat loss and calorie burning"
            icon={<TrendingDown size={24} color={selectedGoal === 'weight_loss' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'weight_loss'}
            onPress={() => setSelectedGoal('weight_loss')}
          />
          
          <GoalCard
            title="Weight Gain"
            description="Focus on healthy weight gain and mass building"
            icon={<Weight size={24} color={selectedGoal === 'weight_gain' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'weight_gain'}
            onPress={() => setSelectedGoal('weight_gain')}
          />
          
          <GoalCard
            title="Personal Training"
            description="Coming soon - Get a personalized training plan"
            icon={<Users size={24} color={selectedGoal === 'personal_training' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'personal_training'}
            onPress={() => setSelectedGoal('personal_training')}
          />
        </View>

        <View style={styles.footer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            size="medium"
            style={styles.backButton}
            disabled={isLoading}
          />
          <Button
            title="Complete Setup"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.completeButton}
            disabled={!selectedGoal}
            isLoading={isLoading}
          />
        </View>
      </ScrollView>
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
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  goalsContainer: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingVertical: 24,
    gap: 16,
  },
  backButton: {
    flex: 0.7,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  completeButton: {
    flex: 1.5,
    minWidth: 0,
    paddingHorizontal: 16,
  },
});