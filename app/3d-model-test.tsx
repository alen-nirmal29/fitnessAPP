import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text, SafeAreaView, StatusBar } from 'react-native';
import Body3DModel from '@/components/Body3DModel';

export default function ModelTestScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>3D Model Test Page</Text>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%', height: 350, marginVertical: 12, alignSelf: 'center' }}>
        <Body3DModel gender="male" />
      </Animated.View>
      <Text style={styles.caption}>If you see the 3D model above, loading works!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181C22',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  caption: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 24,
    textAlign: 'center',
  },
}); 