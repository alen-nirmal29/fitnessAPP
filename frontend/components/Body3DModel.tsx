import React, { Suspense, useRef, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/colors';

// Temporarily disable 3D rendering to prevent View property errors
const USE_3D_RENDERING = false;

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
}

export default function Body3DModel({
  gender = 'male',
  measurements,
  style = {},
}: Body3DModelProps) {
  const [hasError, setHasError] = useState(false);

  // Return a simple placeholder instead of 3D model to prevent View property errors
  if (!USE_3D_RENDERING || hasError) {
    return (
      <View style={[styles.container, style, styles.fallback]}>
        <Text style={styles.fallbackText}>3D Body Model</Text>
        <Text style={styles.fallbackSubtext}>Coming Soon</Text>
      </View>
    );
  }

  // This section is temporarily disabled
  return (
    <View style={[styles.container, style, styles.fallback]}>
      <Text style={styles.fallbackText}>3D Body Model</Text>
      <Text style={styles.fallbackSubtext}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 350,
    backgroundColor: '#181C22',
    borderRadius: 16,
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fallbackSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  },
});
