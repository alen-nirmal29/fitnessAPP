import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { ScrollView as RNScrollView } from 'react-native';
import { router } from 'expo-router';
import { MessageSquare, Sparkles, Clock, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import BackButton from '@/components/BackButton';

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

  const getDurationLabel = (value: string) => {
    switch (value) {
      case '1_month': return '1 Month';
      case '3_month': return '3 Months';
      case '6_month': return '6 Months';
      default: return '1 Month';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Sparkles size={28} color={Colors.dark.gradient.primary} style={styles.titleIcon} />
              <Text style={styles.title}>AI Workout Generator</Text>
            </View>
            <Text style={styles.subtitle}>
              Create a personalized workout plan tailored to your body composition, fitness level, and goals
            </Text>
          </View>

          {/* How it works card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Target size={20} color={Colors.dark.accent} />
              <Text style={styles.infoTitle}>How AI Works</Text>
            </View>
            <Text style={styles.infoText}>
              Our advanced AI analyzes your profile data including age, gender, body measurements, 
              fitness level, and specific goals to create a customized workout plan that adapts to your needs.
            </Text>
          </Card>

          {/* Plan Duration Section */}
          <Card style={styles.durationCard}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={Colors.dark.accent} />
              <Text style={styles.sectionTitle}>Plan Duration</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Choose how long you want your workout plan to last
            </Text>
            <RNScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationScrollContainer}
            >
              {['1_month', '3_month', '6_month'].map((option) => (
                <Button
                  key={option}
                  title={getDurationLabel(option)}
                  onPress={() => handleDurationSelect(option)}
                  variant={duration === option ? 'primary' : 'outline'}
                  size="medium"
                  style={[
                    styles.durationButton,
                    duration === option && styles.selectedDurationButton
                  ]}
                  textStyle={[
                    styles.durationButtonText,
                    duration === option && styles.selectedDurationButtonText
                  ]}
                />
              ))}
            </RNScrollView>
          </Card>

          {/* Additional Details Section */}
          <Card style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color={Colors.dark.accent} />
              <Text style={styles.sectionTitle}>Additional Details</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Help us create an even more personalized plan
            </Text>
            
            <Input
              placeholder="E.g., I have access to a gym, I prefer morning workouts, I have knee issues, etc."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={Platform.OS === 'ios' ? 0 : 4}
              style={styles.messageInput}
              inputStyle={styles.textArea}
            />
          </Card>

          {/* Error Display */}
          {error && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </Card>
          )}

          {/* Generating State */}
          {isGenerating && (
            <Card style={styles.generatingCard}>
              <ActivityIndicator size="large" color={Colors.dark.gradient.primary} />
              <Text style={styles.generatingTitle}>Creating Your Plan</Text>
              <Text style={styles.generatingText}>
                Our AI is analyzing your profile and crafting a personalized workout plan...
              </Text>
            </Card>
          )}
        </ScrollView>

        {/* Fixed footer for action buttons */}
        <View style={styles.footer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Generate My Plan"
            onPress={handleGeneratePlan}
            variant="primary"
            size="large"
            style={styles.generateButton}
            isLoading={isLoading || isGenerating}
            leftIcon={<Sparkles size={20} color="#fff" />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  infoCard: {
    marginBottom: 24,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 22,
  },
  durationCard: {
    marginBottom: 24,
    padding: 20,
  },
  detailsCard: {
    marginBottom: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    minHeight: 36, // reduced from 48
    borderRadius: 10, // slightly smaller
    marginHorizontal: 2, // add a little space between buttons
    paddingVertical: 0, // reduce padding
    paddingHorizontal: 0, // reduce padding
  },
  selectedDurationButton: {
    transform: [{ scale: 1.02 }],
  },
  durationButtonText: {
    fontSize: 12, // reduced from 14
    fontWeight: '600',
  },
  selectedDurationButtonText: {
    fontWeight: '700',
  },
  messageInput: {
    height: 120,
    marginTop: 8,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: Colors.dark.error,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 14,
    textAlign: 'center',
  },
  generatingCard: {
    marginBottom: 24,
    padding: 32,
    alignItems: 'center',
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  generatingText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  generateButton: {
    flex: 2,
    marginLeft: 8,
    paddingVertical: 14, // more vertical padding
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  durationScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
});