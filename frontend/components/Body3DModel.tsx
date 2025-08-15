import React from 'react';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import BodyScaler from './BodyScaler';

interface Measurements {
  neck?: number;
  chest?: number;
  waist?: number;
  leftarm?: number;
  rightarm?: number;
  leftforehand?: number;
  rightforehand?: number;
  leftthigh?: number;
  rightthigh?: number;
  leftleg?: number;
  rightleg?: number;
}

interface Body3DModelProps {
  gender?: 'male' | 'female';
  measurements?: Measurements;
  style?: any;
  readOnly?: boolean;
  interactive?: boolean;
  onMeasurementsChange?: (measurements: Record<string, number>) => void;
}

// This component now uses the 2D BodyScaler instead of 3D model
export default function Body3DModel({
  gender = 'male',
  measurements,
  style = {},
  readOnly = false,
  interactive = true,
  onMeasurementsChange
}: Body3DModelProps) {
  return (
    <BodyScaler 
      gender={gender}
      measurements={measurements}
      style={style}
      readOnly={readOnly}
      interactive={interactive}
      onMeasurementsChange={onMeasurementsChange}
    />
  );
}

const styles = StyleSheet.create({
  // Styles are now handled by the BodyScaler component
});
