import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Body3DModel from '@/components/Body3DModel';
import { useAuthStore } from '@/store/auth-store';
import { BodyMeasurements } from '@/types/user';
import BackButton from '@/components/BackButton';
import Input from '@/components/Input';
import { Ruler, Weight, User } from 'lucide-react-native';

export default function BodyModelScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  const [measurements, setMeasurements] = useState({
    chest: '',
    neck: '',
    waist: '',
    leftarm: '',
    rightarm: '',
    leftthigh: '',
    rightthigh: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Body model screen mounted, setting onboarding flag');
    setInOnboarding(true);
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

  const handleMeasurementsChange = useCallback((newMeasurements: Record<string, number>) => {
    setMeasurements(prev => ({
      ...prev,
      ...newMeasurements,
    }));
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['chest','neck','waist','leftarm','rightarm','leftthigh','rightthigh'];
    requiredFields.forEach(field => {
      if (!measurements[field] || isNaN(Number(measurements[field])) || Number(measurements[field]) <= 0) {
        newErrors[field] = 'Required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      setInOnboarding(true);
              await updateProfile({
        currentMeasurements: {
          chest: Number(measurements.chest),
          neck: Number(measurements.neck),
          waist: Number(measurements.waist),
          leftarm: Number(measurements.leftarm),
          rightarm: Number(measurements.rightarm),
          leftthigh: Number(measurements.leftthigh),
          rightthigh: Number(measurements.rightthigh),
        },
      });
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
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
          <Text style={styles.title}>Visualize Your Progress</Text>
          <Text style={styles.subtitle}>
            Welcome to your personal body model! This is a safe space to see your unique shape and set inspiring goals. Adjust your measurements and watch your transformation come to life. Remember, every body is beautiful and every step counts!
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <Body3DModel gender={user?.gender === 'female' ? 'female' : 'male'} measurements={{
            chest: Number(measurements.chest) || 50,
            neck: Number(measurements.neck) || 40,
            waist: Number(measurements.waist) || 50,
            leftarm: Number(measurements.leftarm) || 30,
            rightarm: Number(measurements.rightarm) || 30,
            leftthigh: Number(measurements.leftthigh) || 40,
            rightthigh: Number(measurements.rightthigh) || 40,
          }} />
        </Animated.View>
        <View style={{ marginTop: 24 }}>
          <Input label="Chest (cm)" value={measurements.chest} onChangeText={v => handleInputChange('chest', v)} keyboardType="numeric" error={errors.chest} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Neck (cm)" value={measurements.neck} onChangeText={v => handleInputChange('neck', v)} keyboardType="numeric" error={errors.neck} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Waist (cm)" value={measurements.waist} onChangeText={v => handleInputChange('waist', v)} keyboardType="numeric" error={errors.waist} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Left Arm (cm)" value={measurements.leftarm} onChangeText={v => handleInputChange('leftarm', v)} keyboardType="numeric" error={errors.leftarm} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Right Arm (cm)" value={measurements.rightarm} onChangeText={v => handleInputChange('rightarm', v)} keyboardType="numeric" error={errors.rightarm} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Left Thigh (cm)" value={measurements.leftthigh} onChangeText={v => handleInputChange('leftthigh', v)} keyboardType="numeric" error={errors.leftthigh} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
          <Input label="Right Thigh (cm)" value={measurements.rightthigh} onChangeText={v => handleInputChange('rightthigh', v)} keyboardType="numeric" error={errors.rightthigh} leftIcon={<Ruler size={20} color={Colors.dark.subtext} />} />
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionsText}>
            • Tap and drag the colored points to adjust your measurements
          </Text>
          <Text style={styles.instructionsText}>
            • Switch between front and back views by tapping the model
          </Text>
          <Text style={styles.instructionsText}>
            • Compare your current and goal body shapes (if set)
          </Text>
          <Text style={styles.instructionsText}>
            • All changes are saved for your fitness journey
          </Text>
          <Text style={[styles.instructionsText, { color: Colors.dark.accent, fontWeight: 'bold', marginTop: 8 }]}>You are stronger than you think. Let's get started!</Text>
        </View>

        <View style={[styles.footer, {alignItems: 'center'}]}>
          <BackButton
            onPress={handleBack}
            disabled={isLoading}
            style={{ marginRight: 12 }}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={[styles.button, { flex: 1 }]}
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