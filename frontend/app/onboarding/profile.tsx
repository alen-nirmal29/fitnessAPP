import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ruler, Weight, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import { Gender } from '@/types/user';

export default function ProfileScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ height?: string; weight?: string; gender?: string }>({});

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Profile screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, [setInOnboarding]);

  const validateForm = () => {
    const newErrors: { height?: string; weight?: string; gender?: string } = {};
    
    if (!height) {
      newErrors.height = 'Height is required';
    } else if (isNaN(Number(height)) || Number(height) <= 0 || Number(height) > 300) {
      newErrors.height = 'Please enter a valid height (1-300 cm)';
    }
    
    if (!weight) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(Number(weight)) || Number(weight) <= 0 || Number(weight) > 500) {
      newErrors.weight = 'Please enter a valid weight (1-500 kg)';
    }
    
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    console.log('Profile handleNext called');
    console.log('Current user:', user);
    console.log('Form data:', { height, weight, gender });
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsLoading(true);
    
    try {
      // Set onboarding flag to prevent redirects
      setInOnboarding(true);
      
      console.log('Updating profile...');
      
      // Update profile with the new data
      updateProfile({
        height: Number(height),
        weight: Number(weight),
        gender: gender as Gender,
      });
      
      console.log('Profile updated, navigating to goals page...');
      
      // Navigate to goals page using replace to prevent navigation stack issues
      router.replace('/onboarding/goals');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to save profile information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGender = (selectedGender: Gender) => {
    setGender(selectedGender);
    setErrors(prev => ({ ...prev, gender: undefined }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>Let's get to know you better</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Height (cm)"
            placeholder="Enter your height in centimeters"
            value={height}
            onChangeText={(text) => {
              setHeight(text);
              if (errors.height) {
                setErrors(prev => ({ ...prev, height: undefined }));
              }
            }}
            keyboardType="numeric"
            error={errors.height}
            leftIcon={<Ruler size={20} color={Colors.dark.subtext} />}
          />
          
          <Input
            label="Weight (kg)"
            placeholder="Enter your weight in kilograms"
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              if (errors.weight) {
                setErrors(prev => ({ ...prev, weight: undefined }));
              }
            }}
            keyboardType="numeric"
            error={errors.weight}
            leftIcon={<Weight size={20} color={Colors.dark.subtext} />}
          />
          
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <Button
              title="Male"
              onPress={() => handleSelectGender('male')}
              variant={gender === 'male' ? 'primary' : 'outline'}
              style={styles.genderButton}
              leftIcon={<User size={16} color={gender === 'male' ? '#fff' : Colors.dark.accent} />}
            />
            <Button
              title="Female"
              onPress={() => handleSelectGender('female')}
              variant={gender === 'female' ? 'primary' : 'outline'}
              style={styles.genderButton}
              leftIcon={<User size={16} color={gender === 'female' ? '#fff' : Colors.dark.accent} />}
            />
            <Button
              title="Other"
              onPress={() => handleSelectGender('other')}
              variant={gender === 'other' ? 'primary' : 'outline'}
              style={styles.genderButton}
              leftIcon={<User size={16} color={gender === 'other' ? '#fff' : Colors.dark.accent} />}
            />
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="xlarge"
            style={[styles.button, {minHeight: 64}]}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  genderButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  errorText: {
    color: Colors.dark.error,
    marginTop: 4,
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
  },
  button: {
    width: '100%',
  },
});