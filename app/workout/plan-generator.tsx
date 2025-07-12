import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';

export default function PlanGeneratorScreen() {
  const { user } = useAuthStore();
  const { generateWorkoutPlan, isLoading, error } = useWorkoutStore();
  
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState('1_month');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    if (!user?.specificGoal) return;
    
    setIsGenerating(true);
    try {
      // Prepare user details for AI
      const userDetails = {
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        fitnessLevel: user.fitnessLevel,
        bodyFat: user.bodyFat,
        currentMeasurements: user.currentMeasurements,
        goalMeasurements: user.goalMeasurements,
        specificGoal: user.specificGoal,
        additionalNotes: message,
      };
      
      await generateWorkoutPlan(user.specificGoal, duration, userDetails);
      router.push('/workout/plan-details');
    } catch (err) {
      console.error('Error generating plan:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    router.replace('/workout/plan-selection');
  };

  const handleDurationSelect = (selected: string) => {
    setDuration(selected);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate Workout Plan</Text>
          <Text style={styles.subtitle}>
            Our AI will create a personalized workout plan based on your goals and preferences
          </Text>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            We'll use your profile information, body measurements, and fitness goals to create a
            customized workout plan. You can also provide additional details below.
          </Text>
        </Card>

        <View style={styles.form}>
          <Text style={styles.label}>Plan Duration</Text>
          <View style={styles.durationContainer}>
            <Button
              title="1 Month"
              onPress={() => handleDurationSelect('1_month')}
              variant={duration === '1_month' ? 'primary' : 'outline'}
              style={styles.durationButton}
            />
            <Button
              title="3 Months"
              onPress={() => handleDurationSelect('3_month')}
              variant={duration === '3_month' ? 'primary' : 'outline'}
              style={styles.durationButton}
            />
            <Button
              title="6 Months"
              onPress={() => handleDurationSelect('6_month')}
              variant={duration === '6_month' ? 'primary' : 'outline'}
              style={styles.durationButton}
            />
          </View>

          <Input
            label="Additional Details (Optional)"
            placeholder="E.g., I have access to a gym, I prefer morning workouts, etc."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={Platform.OS === 'ios' ? 0 : 4}
            style={styles.messageInput}
            inputStyle={styles.textArea}
            leftIcon={<MessageSquare size={20} color={Colors.dark.subtext} />}
          />
        </View>

        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {isGenerating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.accent} />
            <Text style={styles.generatingText}>
              Generating your personalized workout plan...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={handleBack}
          variant="outline"
          size="large"
          style={styles.button}
        />
        <Button
          title="Generate Plan"
          onPress={handleGeneratePlan}
          variant="primary"
          size="large"
          style={styles.button}
          isLoading={isLoading || isGenerating}
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
  infoCard: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  durationButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  messageInput: {
    height: 120,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorText: {
    color: Colors.dark.error,
    marginBottom: 16,
  },
  generatingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
    marginTop: 16,
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
});