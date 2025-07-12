import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Human2DModel from '@/components/Human2DModel';
import { useAuthStore } from '@/store/auth-store';
import { BodyMeasurements } from '@/types/user';

export default function BodyModelScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    chest: 50,
    waist: 50,
    hips: 50,
    arms: 50,
    legs: 50,
    shoulders: 50,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Body model screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, []);

  const handleMeasurementsChange = useCallback((newMeasurements: Record<string, number>) => {
    setMeasurements(prev => ({
      ...prev,
      ...newMeasurements,
    }));
  }, []);

  const handleNext = async () => {
    console.log('Body model handleNext called');
    console.log('Current user:', user);
    console.log('Measurements:', measurements);
    
    setIsLoading(true);
    
    try {
      // Ensure onboarding flag is set
      setInOnboarding(true);
      
      console.log('Updating current measurements...');
      
      updateProfile({
        currentMeasurements: measurements,
      });
      
      console.log('Current measurements updated, navigating to specific-goals...');
      
      // Navigate to specific goals page using replace to prevent navigation stack issues
      router.replace('/onboarding/specific-goals');
      
    } catch (error) {
      console.error('Error updating measurements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    console.log('Body model back button pressed');
    // Use replace to go back to body composition page
    router.replace('/onboarding/body-composition');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Body Model</Text>
          <Text style={styles.subtitle}>
            This realistic 2D model is generated based on your height, weight, and gender
          </Text>
        </View>

        <Human2DModel 
          user={user}
          goalMeasurements={user?.goalMeasurements}
          showComparison={!!user?.goalMeasurements}
          interactive={true}
          onMeasurementChange={handleMeasurementsChange}
        />

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Customize Your Body Model</Text>
          <Text style={styles.instructionsText}>
            • Ultra-realistic 2D human model with anatomical accuracy
          </Text>
          <Text style={styles.instructionsText}>
            • Drag horizontally to rotate the model 360 degrees
          </Text>
          <Text style={styles.instructionsText}>
            • Tap colored anchor points to customize body measurements
          </Text>
          <Text style={styles.instructionsText}>
            • Enhanced muscle definition and gender-specific features
          </Text>
          <Text style={styles.instructionsText}>
            • Current vs Goal body comparison (when goals are set)
          </Text>
          <Text style={styles.instructionsText}>
            • All measurements saved for progress tracking
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            size="large"
            style={styles.button}
            disabled={isLoading}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.button}
            isLoading={isLoading}
            disabled={isLoading}
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
    marginBottom: 24,
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
  instructionsContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 8,
    lineHeight: 20,
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