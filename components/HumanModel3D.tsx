import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Svg, Path, Circle, G, Ellipse, Line } from 'react-native-svg';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface HumanModel3DProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
}

type AnchorPoint = {
  name: string;
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  color: string;
};

// Calculate realistic proportions based on user data
function calculateProportions(user?: UserProfile | null) {
  if (!user) {
    return {
      shoulderWidth: 45,
      chestWidth: 40,
      waistWidth: 35,
      armWidth: 15,
      legWidth: 20,
      height: 300,
    };
  }

  const weight = user.weight || 70;
  const height = user.height || 170;
  const bmi = weight / ((height / 100) * (height / 100));
  
  // Gender-based proportions
  const isFemale = user.gender === 'female';
  
  // Base proportions
  let shoulderWidth = isFemale ? 40 : 50;
  let chestWidth = isFemale ? 35 : 45;
  let waistWidth = isFemale ? 30 : 35;
  let armWidth = isFemale ? 12 : 18;
  let legWidth = isFemale ? 18 : 22;
  
  // Adjust for BMI
  const bmiAdjustment = Math.max(0.7, Math.min(1.4, bmi / 22));
  shoulderWidth *= bmiAdjustment;
  chestWidth *= bmiAdjustment;
  waistWidth *= bmiAdjustment;
  armWidth *= bmiAdjustment;
  legWidth *= bmiAdjustment;
  
  // Apply body composition if available
  if (user.bodyComposition) {
    const muscleFactor = 1 + ((user.bodyComposition.muscleMass || 40) - 40) / 200;
    const fatFactor = 1 + ((user.bodyComposition.bodyFat || 20) - 20) / 100;
    
    shoulderWidth *= muscleFactor;
    chestWidth *= muscleFactor;
    armWidth *= muscleFactor;
    legWidth *= muscleFactor;
    waistWidth *= fatFactor;
  }
  
  return {
    shoulderWidth: Math.round(shoulderWidth),
    chestWidth: Math.round(chestWidth),
    waistWidth: Math.round(waistWidth),
    armWidth: Math.round(armWidth),
    legWidth: Math.round(legWidth),
    height: 300,
  };
}

export default function HumanModel3D({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
}: HumanModel3DProps) {
  const initialMeasurements = useMemo(() => ({
    shoulders: user?.currentMeasurements?.shoulders || 50,
    chest: user?.currentMeasurements?.chest || 50,
    arms: user?.currentMeasurements?.arms || 50,
    waist: user?.currentMeasurements?.waist || 50,
    legs: user?.currentMeasurements?.legs || 50,
  }), [user?.currentMeasurements]);
  
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  
  const proportions = useMemo(() => calculateProportions(user), [user]);
  
  const anchorPoints: AnchorPoint[] = useMemo(() => [
    {
      name: 'shoulders',
      x: 150,
      y: 80,
      value: measurements.shoulders,
      min: 20,
      max: 80,
      color: '#FF6B6B',
    },
    {
      name: 'chest',
      x: 150,
      y: 120,
      value: measurements.chest,
      min: 20,
      max: 80,
      color: '#4ECDC4',
    },
    {
      name: 'arms',
      x: 200,
      y: 120,
      value: measurements.arms,
      min: 20,
      max: 80,
      color: '#45B7D1',
    },
    {
      name: 'waist',
      x: 150,
      y: 180,
      value: measurements.waist,
      min: 20,
      max: 80,
      color: '#F9CA24',
    },
    {
      name: 'legs',
      x: 150,
      y: 240,
      value: measurements.legs,
      min: 20,
      max: 80,
      color: '#6C5CE7',
    },
  ], [measurements]);

  const handleAnchorPress = useCallback((anchorName: string) => {
    if (!interactive) return;
    
    const anchor = anchorPoints.find(a => a.name === anchorName);
    if (anchor) {
      setSelectedAnchor(anchorName);
      setSliderValue(anchor.value);
    }
  }, [anchorPoints, interactive]);
  
  const handleSliderChange = useCallback((value: number) => {
    if (!selectedAnchor) return;
    
    setSliderValue(value);
    const newMeasurements = { ...measurements, [selectedAnchor]: value };
    setMeasurements(newMeasurements);
    
    // Notify parent
    if (onMeasurementChange) {
      onMeasurementChange(newMeasurements);
    }
  }, [selectedAnchor, onMeasurementChange, measurements]);
  
  const closeSlider = useCallback(() => {
    setSelectedAnchor(null);
  }, []);

  // Generate 2D human body based on measurements
  const generateBodyElements = useMemo(() => {
    const isFemale = user?.gender === 'female';
    const centerX = 150;
    
    // Calculate proportions based on measurements
    const shoulderW = (measurements.shoulders / 50) * 40;
    const chestW = (measurements.chest / 50) * 35;
    const waistW = (measurements.waist / 50) * 30;
    const armW = (measurements.arms / 50) * 12;
    const legW = (measurements.legs / 50) * 18;
    
    return {
      // Head (circle)
      head: { cx: centerX, cy: 45, rx: 18, ry: 22 },
      
      // Neck
      neck: { x1: centerX, y1: 67, x2: centerX, y2: 80 },
      
      // Torso (main body)
      torso: {
        // Shoulders line
        shoulders: { x1: centerX - shoulderW, y1: 85, x2: centerX + shoulderW, y2: 85 },
        // Chest area
        chest: { cx: centerX, cy: 110, rx: chestW, ry: 25 },
        // Waist area  
        waist: { cx: centerX, cy: 160, rx: waistW, ry: 20 },
      },
      
      // Arms
      leftArm: {
        upper: { x1: centerX - shoulderW, y1: 85, x2: centerX - shoulderW - 15, y2: 130 },
        lower: { x1: centerX - shoulderW - 15, y1: 130, x2: centerX - shoulderW - 10, y2: 170 },
        hand: { cx: centerX - shoulderW - 10, cy: 175, r: 6 }
      },
      rightArm: {
        upper: { x1: centerX + shoulderW, y1: 85, x2: centerX + shoulderW + 15, y2: 130 },
        lower: { x1: centerX + shoulderW + 15, y1: 130, x2: centerX + shoulderW + 10, y2: 170 },
        hand: { cx: centerX + shoulderW + 10, cy: 175, r: 6 }
      },
      
      // Legs
      leftLeg: {
        upper: { x1: centerX - 15, y1: 180, x2: centerX - legW, y2: 240 },
        lower: { x1: centerX - legW, y1: 240, x2: centerX - legW + 5, y2: 300 },
        foot: { cx: centerX - legW + 5, cy: 305, rx: 12, ry: 6 }
      },
      rightLeg: {
        upper: { x1: centerX + 15, y1: 180, x2: centerX + legW, y2: 240 },
        lower: { x1: centerX + legW, y1: 240, x2: centerX + legW - 5, y2: 300 },
        foot: { cx: centerX + legW - 5, cy: 305, rx: 12, ry: 6 }
      },
      
      // Gender-specific features
      ...(isFemale ? {
        hips: { cx: centerX, cy: 175, rx: waistW + 8, ry: 15 }
      } : {})
    };
  }, [measurements, user?.gender]);
  
  // Render anchor points
  const renderAnchorPoints = () => {
    if (!interactive) return null;
    
    return anchorPoints.map((anchor) => {
      const isActive = selectedAnchor === anchor.name;
      
      return (
        <TouchableOpacity
          key={anchor.name}
          style={[
            styles.anchorPoint,
            {
              left: anchor.x - 20,
              top: anchor.y - 20,
              backgroundColor: anchor.color,
              transform: [{ scale: isActive ? 1.2 : 1 }],
              shadowColor: anchor.color,
            }
          ]}
          onPress={() => handleAnchorPress(anchor.name)}
          activeOpacity={0.8}
        >
          <Text style={styles.anchorLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
          {isActive && <View style={styles.anchorPulse} />}
        </TouchableOpacity>
      );
    });
  };
  
  // Render slider for active anchor
  const renderSlider = () => {
    if (!selectedAnchor) return null;
    
    const anchor = anchorPoints.find(a => a.name === selectedAnchor);
    if (!anchor) return null;
    
    const progress = (sliderValue - anchor.min) / (anchor.max - anchor.min);
    const screenWidth = Dimensions.get('window').width;
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: Math.max(20, Math.min(screenWidth - 200, anchor.x - 90)),
          top: anchor.y - 80,
          borderColor: anchor.color,
        }
      ]}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{anchor.name}</Text>
          <TouchableOpacity onPress={closeSlider} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderProgress,
            { 
              width: `${progress * 100}%`,
              backgroundColor: anchor.color,
            }
          ]} />
        </View>
        
        <View style={styles.sliderControls}>
          <TouchableOpacity 
            onPress={() => handleSliderChange(Math.max(anchor.min, sliderValue - 5))}
            style={styles.sliderButton}
          >
            <Text style={styles.sliderButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.sliderValue}>{Math.round(sliderValue)}</Text>
          
          <TouchableOpacity 
            onPress={() => handleSliderChange(Math.min(anchor.max, sliderValue + 5))}
            style={styles.sliderButton}
          >
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.modelContainer}>
        <View style={styles.svgContainer}>
          <Svg width="300" height="320" viewBox="0 0 300 320">
            {/* Head */}
            <Ellipse
              cx={generateBodyElements.head.cx}
              cy={generateBodyElements.head.cy}
              rx={generateBodyElements.head.rx}
              ry={generateBodyElements.head.ry}
              fill={user?.gender === 'female' ? '#FFE4E1' : '#E6F3FF'}
              stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="2"
            />
            
            {/* Neck */}
            <Line
              x1={generateBodyElements.neck.x1}
              y1={generateBodyElements.neck.y1}
              x2={generateBodyElements.neck.x2}
              y2={generateBodyElements.neck.y2}
              stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Shoulders */}
            <Line
              x1={generateBodyElements.torso.shoulders.x1}
              y1={generateBodyElements.torso.shoulders.y1}
              x2={generateBodyElements.torso.shoulders.x2}
              y2={generateBodyElements.torso.shoulders.y2}
              stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Chest */}
            <Ellipse
              cx={generateBodyElements.torso.chest.cx}
              cy={generateBodyElements.torso.chest.cy}
              rx={generateBodyElements.torso.chest.rx}
              ry={generateBodyElements.torso.chest.ry}
              fill={user?.gender === 'female' ? 'rgba(255, 182, 193, 0.4)' : 'rgba(135, 206, 235, 0.4)'}
              stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="2"
            />
            
            {/* Waist */}
            <Ellipse
              cx={generateBodyElements.torso.waist.cx}
              cy={generateBodyElements.torso.waist.cy}
              rx={generateBodyElements.torso.waist.rx}
              ry={generateBodyElements.torso.waist.ry}
              fill={user?.gender === 'female' ? 'rgba(255, 182, 193, 0.3)' : 'rgba(135, 206, 235, 0.3)'}
              stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'}
              strokeWidth="2"
            />
            
            {/* Female hips */}
            {user?.gender === 'female' && generateBodyElements.hips && (
              <Ellipse
                cx={generateBodyElements.hips.cx}
                cy={generateBodyElements.hips.cy}
                rx={generateBodyElements.hips.rx}
                ry={generateBodyElements.hips.ry}
                fill="rgba(255, 182, 193, 0.3)"
                stroke="#FFB6C1"
                strokeWidth="2"
              />
            )}
            
            {/* Arms */}
            <G>
              {/* Left arm */}
              <Line {...generateBodyElements.leftArm.upper} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="8" strokeLinecap="round" />
              <Line {...generateBodyElements.leftArm.lower} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="6" strokeLinecap="round" />
              <Circle {...generateBodyElements.leftArm.hand} fill={user?.gender === 'female' ? '#FFE4E1' : '#E6F3FF'} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="1" />
              
              {/* Right arm */}
              <Line {...generateBodyElements.rightArm.upper} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="8" strokeLinecap="round" />
              <Line {...generateBodyElements.rightArm.lower} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="6" strokeLinecap="round" />
              <Circle {...generateBodyElements.rightArm.hand} fill={user?.gender === 'female' ? '#FFE4E1' : '#E6F3FF'} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="1" />
            </G>
            
            {/* Legs */}
            <G>
              {/* Left leg */}
              <Line {...generateBodyElements.leftLeg.upper} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="12" strokeLinecap="round" />
              <Line {...generateBodyElements.leftLeg.lower} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="10" strokeLinecap="round" />
              <Ellipse {...generateBodyElements.leftLeg.foot} fill={user?.gender === 'female' ? '#FFE4E1' : '#E6F3FF'} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="1" />
              
              {/* Right leg */}
              <Line {...generateBodyElements.rightLeg.upper} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="12" strokeLinecap="round" />
              <Line {...generateBodyElements.rightLeg.lower} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="10" strokeLinecap="round" />
              <Ellipse {...generateBodyElements.rightLeg.foot} fill={user?.gender === 'female' ? '#FFE4E1' : '#E6F3FF'} stroke={user?.gender === 'female' ? '#FFB6C1' : '#87CEEB'} strokeWidth="1" />
            </G>
          </Svg>
        </View>
        
        {renderAnchorPoints()}
        {renderSlider()}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>• Interactive 2D body model</Text>
        <Text style={styles.instructionText}>• Tap colored points to adjust measurements</Text>
        <Text style={styles.instructionText}>• Use +/- buttons to customize body proportions</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.dark.background,
    position: 'relative',
  },
  modelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 40, 0.8)',
    position: 'relative',
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchorPoint: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  anchorLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  anchorPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.4,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 16,
    minWidth: 180,
    zIndex: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 12,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 3,
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '400',
  },
});