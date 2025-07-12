import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Ruler, Weight, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import { Gender } from '@/types/user';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    gender: user?.gender || 'other' as Gender,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) < 100 || Number(formData.height) > 250)) {
      newErrors.height = 'Height must be between 100-250 cm';
    }
    
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 30 || Number(formData.weight) > 300)) {
      newErrors.weight = 'Weight must be between 30-300 kg';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const updatedProfile = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        gender: formData.gender,
      };
      
      updateProfile(updatedProfile);
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGenderSelect = (gender: Gender) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <Input
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              leftIcon={<User size={20} color={Colors.dark.subtext} />}
              error={errors.name}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Input
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              leftIcon={<Mail size={20} color={Colors.dark.subtext} />}
              error={errors.email}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Height (cm)</Text>
              <Input
                value={formData.height}
                onChangeText={(text) => setFormData(prev => ({ ...prev, height: text }))}
                placeholder="170"
                leftIcon={<Ruler size={20} color={Colors.dark.subtext} />}
                error={errors.height}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Weight (kg)</Text>
              <Input
                value={formData.weight}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
                placeholder="70"
                leftIcon={<Weight size={20} color={Colors.dark.subtext} />}
                error={errors.weight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <Button
                title="Male"
                onPress={() => handleGenderSelect('male')}
                variant={formData.gender === 'male' ? 'primary' : 'outline'}
                style={styles.genderButton}
                leftIcon={<User size={16} color={formData.gender === 'male' ? '#fff' : Colors.dark.accent} />}
              />
              <Button
                title="Female"
                onPress={() => handleGenderSelect('female')}
                variant={formData.gender === 'female' ? 'primary' : 'outline'}
                style={styles.genderButton}
                leftIcon={<User size={16} color={formData.gender === 'female' ? '#fff' : Colors.dark.accent} />}
              />
              <Button
                title="Other"
                onPress={() => handleGenderSelect('other')}
                variant={formData.gender === 'other' ? 'primary' : 'outline'}
                style={styles.genderButton}
                leftIcon={<User size={16} color={formData.gender === 'other' ? '#fff' : Colors.dark.accent} />}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
  },
  button: {
    width: '100%',
  },
}); 