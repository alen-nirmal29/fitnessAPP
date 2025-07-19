import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced anchor points for the body model
type AnchorPoint = {
  x: number;
  y: number;
  label: string;
  value: number;
  min: number;
  max: number;
  bodyPart: 'shoulders' | 'chest' | 'arms' | 'waist' | 'legs';
};

type AnchorsType = {
  shoulders: AnchorPoint;
  chest: AnchorPoint;
  arms: AnchorPoint;
  waist: AnchorPoint;
  legs: AnchorPoint;
};

const createInitialAnchors = (user?: UserProfile | null): AnchorsType => {
  // Adjust positions based on user data
  const heightFactor = user?.height ? (user.height / 170) : 1;
  const baseY = 80;
  const spacing = 40 * heightFactor;
  
  return {
    shoulders: { 
      x: 150, 
      y: baseY, 
      label: 'Shoulders', 
      value: user?.currentMeasurements?.shoulders || 50,
      min: 30,
      max: 80,
      bodyPart: 'shoulders'
    },
    chest: { 
      x: 150, 
      y: baseY + spacing, 
      label: 'Chest', 
      value: user?.currentMeasurements?.chest || 50,
      min: 30,
      max: 80,
      bodyPart: 'chest'
    },
    arms: { 
      x: 220, 
      y: baseY + spacing, 
      label: 'Arms', 
      value: user?.currentMeasurements?.arms || 50,
      min: 20,
      max: 70,
      bodyPart: 'arms'
    },
    waist: { 
      x: 150, 
      y: baseY + spacing * 2, 
      label: 'Waist', 
      value: user?.currentMeasurements?.waist || 50,
      min: 25,
      max: 75,
      bodyPart: 'waist'
    },
    legs: { 
      x: 150, 
      y: baseY + spacing * 3.5, 
      label: 'Legs', 
      value: user?.currentMeasurements?.legs || 50,
      min: 30,
      max: 80,
      bodyPart: 'legs'
    },
  };
};

interface BodyModelCanvasProps {
  user?: UserProfile | null;
  onMeasurementsChange?: (measurements: Record<string, number>) => void;
  readOnly?: boolean;
  interactive?: boolean;
}

export default function BodyModelCanvas({ 
  user,
  onMeasurementsChange,
  readOnly = false,
  interactive = true
}: BodyModelCanvasProps) {
  const [anchors, setAnchors] = useState<AnchorsType>(() => createInitialAnchors(user));
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [sliderVisible, setSliderVisible] = useState(false);
  const [sliderPosition, setSliderPosition] = useState({ x: 0, y: 0 });
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => interactive && !readOnly,
    onMoveShouldSetPanResponder: () => interactive && !readOnly,
    onPanResponderGrant: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      // Find which anchor was touched
      const touchedAnchor = Object.entries(anchors).find(([_, anchor]) => {
        const distance = Math.sqrt(
          Math.pow(anchor.x - locationX, 2) + Math.pow(anchor.y - locationY, 2)
        );
        return distance < 35; // Touch radius
      });
      
      if (touchedAnchor) {
        setActiveAnchor(touchedAnchor[0]);
        setSliderVisible(true);
        setSliderPosition({ 
          x: touchedAnchor[1].x, 
          y: touchedAnchor[1].y - 60 
        });
      } else {
        // Start rotation if no anchor touched
        setActiveAnchor(null);
        setSliderVisible(false);
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (activeAnchor) {
        // Handle anchor adjustment
        const { dx } = gestureState;
        
        setAnchors(prev => {
          const anchor = prev[activeAnchor as keyof AnchorsType];
          const sensitivity = 0.2;
          const newValue = Math.min(
            Math.max(anchor.value + dx * sensitivity, anchor.min), 
            anchor.max
          );
          
          const updated = {
            ...prev,
            [activeAnchor]: {
              ...anchor,
              value: newValue,
            },
          };
          
          // Notify parent component of changes
          if (onMeasurementsChange) {
            const measurements = Object.entries(updated).reduce((acc, [key, anchor]) => {
              acc[key] = anchor.value;
              return acc;
            }, {} as Record<string, number>);
            
            onMeasurementsChange(measurements);
          }
          
          return updated;
        });
      } else {
        // Handle rotation
        const { dx } = gestureState;
        const newRotation = rotation + dx * 0.01;
        setRotation(newRotation);
        
        Animated.timing(rotationAnim, {
          toValue: newRotation,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    },
    onPanResponderRelease: () => {
      setTimeout(() => {
        setActiveAnchor(null);
        setSliderVisible(false);
      }, 100);
    },
  });

  // Calculate proportions based on user data
  const getProportions = () => {
    const heightFactor = user?.height ? (user.height / 170) : 1;
    const weightFactor = user?.weight ? Math.sqrt(user.weight / 70) : 1;
    const genderFactor = user?.gender === 'female' ? 0.9 : user?.gender === 'male' ? 1.1 : 1.0;
    
    return {
      heightFactor,
      weightFactor,
      genderFactor,
    };
  };
  
  const proportions = getProportions();
  
  // Draw the enhanced body model
  const renderBodyModel = () => {
    const baseWidth = 80;
    const baseHeight = 120;
    
    return (
      <Animated.View 
        style={[
          styles.bodyModel,
          {
            transform: [{ rotateY: `${rotation * 50}deg` }],
          }
        ]}
      >
        {/* Head */}
        <View style={[
          styles.head,
          {
            width: 50 * proportions.heightFactor,
            height: 50 * proportions.heightFactor,
            borderRadius: 25 * proportions.heightFactor,
          }
        ]} />
        
        {/* Neck */}
        <View style={[
          styles.neck,
          {
            width: 15 * proportions.genderFactor,
            height: 20 * proportions.heightFactor,
          }
        ]} />
        
        {/* Shoulders */}
        <View style={[
          styles.shoulders,
          {
            width: baseWidth * (anchors.shoulders.value / 50) * proportions.genderFactor,
            height: 15,
          }
        ]} />
        
        {/* Torso */}
        <View style={[
          styles.torso,
          {
            width: baseWidth * (anchors.chest.value / 50) * proportions.weightFactor,
            height: baseHeight * (anchors.waist.value / 50) * proportions.heightFactor,
          }
        ]} />
        
        {/* Arms */}
        <View style={[
          styles.leftArm,
          {
            width: 20 * (anchors.arms.value / 50) * proportions.genderFactor,
            height: 80 * proportions.heightFactor,
            left: (baseWidth * (anchors.shoulders.value / 50) * proportions.genderFactor) / 2 + 10,
          }
        ]} />
        <View style={[
          styles.rightArm,
          {
            width: 20 * (anchors.arms.value / 50) * proportions.genderFactor,
            height: 80 * proportions.heightFactor,
            right: (baseWidth * (anchors.shoulders.value / 50) * proportions.genderFactor) / 2 + 10,
          }
        ]} />
        
        {/* Waist */}
        <View style={[
          styles.waist,
          {
            width: baseWidth * 0.8 * (anchors.waist.value / 50) * proportions.weightFactor,
            height: 20,
          }
        ]} />
        
        {/* Legs */}
        <View style={[
          styles.leftLeg,
          {
            width: 30 * (anchors.legs.value / 50) * proportions.genderFactor,
            height: 100 * proportions.heightFactor,
            left: (baseWidth * 0.8 * (anchors.waist.value / 50) * proportions.weightFactor) / 4,
          }
        ]} />
        <View style={[
          styles.rightLeg,
          {
            width: 30 * (anchors.legs.value / 50) * proportions.genderFactor,
            height: 100 * proportions.heightFactor,
            right: (baseWidth * 0.8 * (anchors.waist.value / 50) * proportions.weightFactor) / 4,
          }
        ]} />
        
        {/* 3D effect shadows */}
        <View style={styles.shadow} />
      </Animated.View>
    );
  };

  // Render enhanced anchor points
  const renderAnchors = () => {
    return Object.entries(anchors).map(([key, anchor]) => {
      const isActive = activeAnchor === key;
      const scale = isActive ? 1.2 : 1;
      
      return (
        <Animated.View 
          key={key}
          style={[
            styles.anchor,
            {
              left: anchor.x,
              top: anchor.y,
              backgroundColor: isActive ? Colors.dark.gradient.primary : Colors.dark.accent,
              transform: [{ scale }],
              shadowColor: isActive ? Colors.dark.gradient.primary : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.5 : 0,
              shadowRadius: 8,
              elevation: isActive ? 8 : 4,
            }
          ]}
        >
          <Text style={styles.anchorLabel}>{anchor.label}</Text>
          <Text style={styles.anchorValue}>{Math.round(anchor.value)}</Text>
          
          {isActive && (
            <View style={styles.activeIndicator} />
          )}
        </Animated.View>
      );
    });
  };
  
  // Render slider for active anchor
  const renderSlider = () => {
    if (!sliderVisible || !activeAnchor) return null;
    
    const anchor = anchors[activeAnchor as keyof AnchorsType];
    const progress = (anchor.value - anchor.min) / (anchor.max - anchor.min);
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: Math.max(20, Math.min(screenWidth - 170, sliderPosition.x - 75)),
          top: Math.max(20, sliderPosition.y),
        }
      ]}>
        <Text style={styles.sliderLabel}>{anchor.label}</Text>
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderProgress,
            { width: `${progress * 100}%` }
          ]} />
          <View style={[
            styles.sliderThumb,
            { left: `${progress * 100}%` }
          ]} />
        </View>
        <View style={styles.sliderValues}>
          <Text style={styles.sliderMinMax}>{anchor.min}</Text>
          <Text style={styles.sliderValue}>{Math.round(anchor.value)}</Text>
          <Text style={styles.sliderMinMax}>{anchor.max}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <LinearGradient
        colors={[
          user?.gender === 'female' 
            ? 'rgba(255, 182, 193, 0.1)' 
            : user?.gender === 'male'
            ? 'rgba(135, 206, 235, 0.1)'
            : 'rgba(59, 95, 227, 0.1)', 
          'rgba(123, 44, 191, 0.1)'
        ]}
        style={styles.gradient}
      >
        {renderBodyModel()}
        {interactive && !readOnly && renderAnchors()}
        {renderSlider()}
        
        {readOnly && (
          <View style={styles.readOnlyOverlay}>
            <Text style={styles.readOnlyText}>Model Preview</Text>
            <Text style={styles.readOnlySubtext}>Tap to customize in interactive mode</Text>
          </View>
        )}
        
        {interactive && !readOnly && (
          <View style={styles.instructionsOverlay}>
            <Text style={styles.instructionText}>• Drag to rotate 360°</Text>
            <Text style={styles.instructionText}>• Tap anchor points to adjust</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyModel: {
    position: 'relative',
    width: 200,
    height: 350,
    alignItems: 'center',
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  neck: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 45,
    borderRadius: 8,
  },
  shoulders: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 65,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  torso: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  leftArm: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightArm: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  waist: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftLeg: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightLeg: {
    backgroundColor: '#ffdbac',
    position: 'absolute',
    top: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shadow: {
    position: 'absolute',
    bottom: -10,
    left: 20,
    right: 20,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 50,
    opacity: 0.5,
  },
  anchor: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    transform: [{ translateX: -25 }, { translateY: -25 }],
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  anchorLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  anchorValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.dark.gradient.primary,
    opacity: 0.6,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    minWidth: 150,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  sliderLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  sliderTrack: {
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 12,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    backgroundColor: Colors.dark.gradient.primary,
    borderRadius: 7,
    transform: [{ translateX: -7 }],
    borderWidth: 2,
    borderColor: '#fff',
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  sliderValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderMinMax: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  readOnlyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  readOnlySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
});