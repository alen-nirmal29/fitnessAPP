import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import GoalCard from '@/components/GoalCard';
import { useAuthStore } from '@/store/auth-store';
import { FitnessGoal } from '@/types/user';
import BackButton from '@/components/BackButton';

export default function GoalsScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Goals screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, [setInOnboarding]);

  const handleNext = async () => {
    console.log('Goals handleNext called');
    console.log('Selected goal:', selectedGoal);
    console.log('Current user:', user);
    
    if (selectedGoal) {
      setIsLoading(true);
      
      try {
        // Ensure onboarding flag is set
        setInOnboarding(true);
        
        console.log('Updating fitness goal...');
        
        // Update profile with the selected goal
        updateProfile({
          fitnessGoal: selectedGoal,
        });
        
        console.log('Fitness goal updated, navigating to body-composition...');
        
        // Navigate to body composition page using replace to prevent navigation stack issues
        router.replace('/onboarding/body-composition');
        
      } catch (error) {
        console.error('Error updating fitness goal:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    // Use replace to go back to profile page
    router.replace('/onboarding/profile');
  };

  const handleGoalSelect = (goal: FitnessGoal) => {
    console.log('Selected goal:', goal);
    setSelectedGoal(goal);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Fitness Goals</Text>
          <Text style={styles.subtitle}>What are you looking to achieve?</Text>
        </View>

        <View style={styles.goalsContainer}>
          <GoalCard
            title="Lose Weight"
            description="Burn fat and improve overall fitness"
            icon={<TrendingDown size={24} color={selectedGoal === 'lose_weight' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'lose_weight'}
            onPress={() => handleGoalSelect('lose_weight')}
          />
          
          <GoalCard
            title="Maintain Physique"
            description="Keep your current body composition"
            icon={<Minus size={24} color={selectedGoal === 'maintain' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'maintain'}
            onPress={() => handleGoalSelect('maintain')}
          />
          
          <GoalCard
            title="Gain Weight"
            description="Build muscle and increase strength"
            icon={<TrendingUp size={24} color={selectedGoal === 'gain_weight' ? '#fff' : Colors.dark.accent} />}
            isSelected={selectedGoal === 'gain_weight'}
            onPress={() => handleGoalSelect('gain_weight')}
          />
        </View>

        <View style={styles.footer}>
          <BackButton
            onPress={handleBack}
            disabled={isLoading}
            style={styles.button}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="xlarge"
            style={[styles.button, {minHeight: 64}]}
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
  button: {
    flex: 1,
  },
});