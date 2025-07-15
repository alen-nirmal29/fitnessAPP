import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Percent, Upload, Smartphone, Wifi } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { useAuthStore } from '@/store/auth-store';
import { BodyComposition } from '@/types/user';
import BackButton from '@/components/BackButton';

export default function BodyCompositionScreen() {
  const { updateProfile, user, setInOnboarding } = useAuthStore();
  
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [bodyWater, setBodyWater] = useState('');
  const [bmr, setBmr] = useState('');
  const [visceralFat, setVisceralFat] = useState('');
  const [proteinMass, setProteinMass] = useState('');
  const [bmi, setBmi] = useState('');
  const [muscleRate, setMuscleRate] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [metabolicAge, setMetabolicAge] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [weightWithoutFat, setWeightWithoutFat] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set onboarding flag when component mounts
  useEffect(() => {
    console.log('Body composition screen mounted, setting onboarding flag');
    setInOnboarding(true);
  }, [setInOnboarding]);

  const handleNext = async () => {
    console.log('Body composition handleNext called');
    console.log('Current user:', user);
    
    setIsLoading(true);
    
    try {
      // Set onboarding flag to prevent redirects
      setInOnboarding(true);
      
      const composition: BodyComposition = {};
      
      if (bodyFat && !isNaN(Number(bodyFat))) {
        composition.bodyFat = Number(bodyFat);
      }
      
      if (muscleMass && !isNaN(Number(muscleMass))) {
        composition.muscleMass = Number(muscleMass);
      }
      
      if (boneMass && !isNaN(Number(boneMass))) {
        composition.boneMass = Number(boneMass);
      }
      
      if (bodyWater && !isNaN(Number(bodyWater))) {
        composition.waterWeight = Number(bodyWater);
      }
      
      if (bmr && !isNaN(Number(bmr))) {
        composition.bmr = Number(bmr);
      }
      
      if (visceralFat && !isNaN(Number(visceralFat))) {
        composition.visceralFat = Number(visceralFat);
      }
      
      if (proteinMass && !isNaN(Number(proteinMass))) {
        composition.proteinMass = Number(proteinMass);
      }
      
      if (bmi && !isNaN(Number(bmi))) {
        composition.bmi = Number(bmi);
      }
      
      if (muscleRate && !isNaN(Number(muscleRate))) {
        composition.muscleRate = Number(muscleRate);
      }
      
      if (metabolicAge && !isNaN(Number(metabolicAge))) {
        composition.metabolicAge = Number(metabolicAge);
      }
      
      if (weightWithoutFat && !isNaN(Number(weightWithoutFat))) {
        composition.weightWithoutFat = Number(weightWithoutFat);
      }
      
      console.log('Updating body composition:', composition);
      
      updateProfile({
        bodyComposition: composition,
      });
      
      console.log('Body composition updated, navigating immediately...');
      
      // Navigate to body model page using replace to prevent navigation stack issues
      router.replace('/onboarding/body-model');
      
    } catch (error) {
      console.error('Error updating body composition:', error);
      Alert.alert('Error', 'Failed to save body composition. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    console.log('Body composition back button pressed');
    // Use replace to go back to goals page
    router.replace('/onboarding/goals');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleConnectSmartWatch = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate smart watch connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data from smart watch
      setBodyWeight('75');
      setBodyFat('18');
      setBodyWater('60');
      setBmr('1800');
      setVisceralFat('8');
      setProteinMass('15');
      setBmi('22.5');
      setMuscleRate('45');
      setBoneMass('3.2');
      setMetabolicAge('25');
      setMuscleMass('35');
      setWeightWithoutFat('62');
      
      Alert.alert('Success', 'Smart watch data imported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to smart watch. Please try again.');
    } finally {
      setIsConnecting(false);
    }
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
          <Text style={styles.title}>Body Composition</Text>
          <Text style={styles.subtitle}>Enter your detailed body composition measurements</Text>
        </View>

        <Card style={styles.smartWatchCard}>
          <View style={styles.smartWatchHeader}>
            <Smartphone size={20} color={Colors.dark.accent} />
            <Text style={styles.smartWatchTitle}>Smart Watch Integration</Text>
          </View>
          <Text style={styles.smartWatchText}>
            Connect your smart watch to automatically import your body composition data
          </Text>
          <Button
            title={isConnecting ? "Connecting..." : "Connect Smart Watch"}
            onPress={handleConnectSmartWatch}
            variant="outline"
            style={styles.connectButton}
            leftIcon={<Wifi size={16} color={Colors.dark.accent} />}
            isLoading={isConnecting}
          />
        </Card>

        <View style={styles.form}>
          <View style={styles.row}>
            <Input
              label="Body Weight (kg)"
              placeholder="Enter body weight"
              value={bodyWeight}
              onChangeText={setBodyWeight}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="Body Fat (%)"
              placeholder="Enter body fat"
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Body Water (%)"
              placeholder="Enter body water"
              value={bodyWater}
              onChangeText={setBodyWater}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="BMR (kcal)"
              placeholder="Enter BMR"
              value={bmr}
              onChangeText={setBmr}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Visceral Fat (%)"
              placeholder="Enter visceral fat"
              value={visceralFat}
              onChangeText={setVisceralFat}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="Protein Mass (kg)"
              placeholder="Enter protein mass"
              value={proteinMass}
              onChangeText={setProteinMass}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="BMI"
              placeholder="Enter BMI"
              value={bmi}
              onChangeText={setBmi}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="Muscle Rate (%)"
              placeholder="Enter muscle rate"
              value={muscleRate}
              onChangeText={setMuscleRate}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Bone Mass (kg)"
              placeholder="Enter bone mass"
              value={boneMass}
              onChangeText={setBoneMass}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="Metabolic Age"
              placeholder="Enter metabolic age"
              value={metabolicAge}
              onChangeText={setMetabolicAge}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Muscle Mass (kg)"
              placeholder="Enter muscle mass"
              value={muscleMass}
              onChangeText={setMuscleMass}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
            
            <Input
              label="Weight Without Fat (kg)"
              placeholder="Enter weight without fat"
              value={weightWithoutFat}
              onChangeText={setWeightWithoutFat}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              leftIcon={<Percent size={20} color={Colors.dark.subtext} />}
            />
          </View>
          
          <Text style={styles.label}>Upload Body Composition Screenshot</Text>
          <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
            {image ? (
              <View style={styles.imagePreview}>
                <Text style={styles.uploadText}>Image Selected</Text>
                <Button
                  title="Change Image"
                  onPress={pickImage}
                  variant="outline"
                  size="small"
                />
              </View>
            ) : (
              <>
                <Upload size={24} color={Colors.dark.accent} />
                <Text style={styles.uploadText}>Upload from your device</Text>
              </>
            )}
          </TouchableOpacity>
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
  smartWatchCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
  },
  smartWatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartWatchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  smartWatchText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
    marginBottom: 16,
  },
  connectButton: {
    alignSelf: 'flex-start',
  },
  form: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  uploadContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    marginBottom: 16,
  },
  uploadText: {
    color: Colors.dark.subtext,
    marginTop: 8,
  },
  imagePreview: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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