import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import Rive from 'rive-react-native';

// Import .riv files from assets
import maleModel from '../assets/male_human_rigged.riv';
import femaleModel from '../assets/female_human_rigged.riv';
import Colors from '@/constants/colors';

interface BodyScalerProps {
  gender?: 'male' | 'female';
  style?: any;
  measurements?: any;
  readOnly?: boolean;
  interactive?: boolean;
  onMeasurementsChange?: (measurements: Record<string, number>) => void;
}

export default function BodyScaler({
  gender = 'male',
  style = {},
  measurements,
  readOnly = false,
  interactive = true,
  onMeasurementsChange
}: BodyScalerProps) {
  const riveRef = useRef(null);
  const [selectedBone, setSelectedBone] = useState('head');
  const [scale, setScale] = useState(1.0);

  // Bone names must match exactly as in your Rive file
  const bones = [
    { label: 'Neck', name: 'head' },
    { label: 'Chest', name: 'Chest' },
    { label: 'Waist', name: 'Root Hip' },
    { label: 'Right Arm', name: 'right arm1' },
    { label: 'Left Arm', name: 'left arm1' },
    { label: 'Right Thigh', name: 'right thigh1' },
    { label: 'Left Thigh', name: 'left thigh1' }
  ];

  // Update scale when bone changes
  useEffect(() => {
    if (riveRef.current) {
      riveRef.current.setNodeScale(selectedBone, scale, scale);
    }
  }, [selectedBone]);

  // Handle slider change
  const handleScaleChange = (value) => {
    setScale(value);
    if (riveRef.current) {
      riveRef.current.setNodeScale(selectedBone, value, value);
    }
    
    // If onMeasurementsChange is provided, call it with the updated measurements
    if (onMeasurementsChange) {
      const updatedMeasurements = {};
      // Map bone names to measurement names
      const boneToMeasurement = {
        'head': 'neck',
        'Chest': 'chest',
        'Root Hip': 'waist',
        'right arm1': 'rightarm',
        'left arm1': 'leftarm',
        'right thigh1': 'rightthigh',
        'left thigh1': 'leftthigh'
      };
      
      const measurementName = boneToMeasurement[selectedBone];
      if (measurementName) {
        updatedMeasurements[measurementName] = Math.round(value * 50); // Scale to reasonable measurement value
        onMeasurementsChange(updatedMeasurements);
      }
    }
  };

  // If in readOnly mode, just show the model with preset measurements
  if (readOnly) {
    return (
      <View style={[styles.container, style]}>
        <Rive
          ref={riveRef}
          resource={gender === 'male' ? maleModel : femaleModel}
          artboardName="Artboard"
          style={styles.rive}
          autoplay
        />
        <Text style={styles.readOnlyText}>Model Preview</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Rive
        ref={riveRef}
        resource={gender === 'male' ? maleModel : femaleModel}
        artboardName="Artboard"
        style={styles.rive}
        autoplay
      />

      {interactive && (
        <View style={styles.controlsContainer}>
          <Picker
            selectedValue={selectedBone}
            style={styles.picker}
            onValueChange={(value) => setSelectedBone(value)}
          >
            {bones.map((bone) => (
              <Picker.Item key={bone.name} label={bone.label} value={bone.name} />
            ))}
          </Picker>

          <Text style={styles.scaleText}>Scale: {scale.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.05}
            value={scale}
            onValueChange={handleScaleChange}
            minimumTrackTintColor={Colors.dark.accent}
            maximumTrackTintColor={Colors.dark.subtext}
            thumbTintColor={Colors.dark.gradient.primary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 10,
  },
  rive: { 
    width: 300, 
    height: 500,
  },
  controlsContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    marginTop: 10,
  },
  picker: { 
    height: 50, 
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: Colors.dark.text,
    marginBottom: 10,
  },
  slider: { 
    width: '100%',
    height: 40,
  },
  scaleText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  readOnlyText: {
    color: Colors.dark.text,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  }
});