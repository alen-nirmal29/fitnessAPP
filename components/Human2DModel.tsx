import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import { Svg, Ellipse, Line, Circle, G, Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';
import { UserProfile } from '@/types/user';

interface Human2DModelProps {
  user?: UserProfile | null;
  goalMeasurements?: Record<string, number>;
  showComparison?: boolean;
  interactive?: boolean;
  onMeasurementChange?: (measurements: Record<string, number>) => void;
  progressMeasurements?: Record<string, number>; // New prop for post-workout measurements
  showProgress?: boolean; // New prop to show progress comparison
  style?: any; // Add style prop for custom styling
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

export default function Human2DModel({
  user,
  goalMeasurements,
  showComparison = false,
  interactive = true,
  onMeasurementChange,
  progressMeasurements,
  showProgress = false,
  style,
}: Human2DModelProps) {
  const initialMeasurements = useMemo(() => {
    // Fallback defaults if user or user.currentMeasurements is missing
    const defaults = {
      shoulders: 50,
      chest: 50,
      arms: 50,
      waist: 50,
      legs: 50,
    };
    return {
      shoulders: user?.currentMeasurements?.shoulders ?? defaults.shoulders,
      chest: user?.currentMeasurements?.chest ?? defaults.chest,
      arms: user?.currentMeasurements?.arms ?? defaults.arms,
      waist: user?.currentMeasurements?.waist ?? defaults.waist,
      legs: user?.currentMeasurements?.legs ?? defaults.legs,
    };
  }, [user?.currentMeasurements]);
  
  // Use progress measurements if showing progress, otherwise use current measurements
  const displayMeasurements = useMemo(() => {
    if (showProgress && progressMeasurements) {
      return {
        shoulders: progressMeasurements.shoulders || initialMeasurements.shoulders,
        chest: progressMeasurements.chest || initialMeasurements.chest,
        arms: progressMeasurements.arms || initialMeasurements.arms,
        waist: progressMeasurements.waist || initialMeasurements.waist,
        legs: progressMeasurements.legs || initialMeasurements.legs,
      };
    }
    return initialMeasurements;
  }, [showProgress, progressMeasurements, initialMeasurements]);
  
  const [measurements, setMeasurements] = useState(displayMeasurements);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
  
  const isFemale = user?.gender === 'female';
  const centerX = (showComparison || showProgress) ? 120 : 160;
  
  // In comparison mode, shift both models left by 40px
  const leftShift = (showComparison || showProgress) ? -40 : 0;
  const shiftedCenterX = centerX + leftShift;
  
  // Calculate body proportions based on measurements and user data
  const bodyProps = useMemo(() => {
    // Base calculations from measurements
    const shoulderW = (measurements.shoulders / 50) * (isFemale ? 35 : 45);
    const chestW = (measurements.chest / 50) * (isFemale ? 32 : 40);
    const waistW = (measurements.waist / 50) * (isFemale ? 28 : 35);
    const armW = (measurements.arms / 50) * (isFemale ? 8 : 12);
    const legW = (measurements.legs / 50) * (isFemale ? 15 : 20);
    
    // Enhanced calculations based on user data
    let enhancedProps = { shoulderW, chestW, waistW, armW, legW };
    
    if (user) {
      // Height factor (taller people have larger proportions)
      const heightFactor = user.height ? (user.height / 170) : 1;
      
      // Weight factor (heavier people have larger proportions)
      const weightFactor = user.weight ? Math.sqrt(user.weight / 70) : 1;
      
      // Gender factor
      const genderFactor = isFemale ? 0.9 : 1.1;
      
      // Muscle mass factor (if available from Google Fit)
      const muscleMassFactor = user.bodyComposition?.muscleMass ? 
        (user.bodyComposition.muscleMass / 40) : 1; // Assuming 40kg is average muscle mass
      
      // Body fat factor (affects waist size)
      const bodyFatFactor = user.bodyComposition?.bodyFat ? 
        (user.bodyComposition.bodyFat / 20) : 1; // Assuming 20% is average
      
      // Apply factors to proportions
      enhancedProps = {
        shoulderW: shoulderW * heightFactor * genderFactor * muscleMassFactor,
        chestW: chestW * heightFactor * weightFactor * muscleMassFactor,
        waistW: waistW * heightFactor * weightFactor * bodyFatFactor,
        armW: armW * heightFactor * muscleMassFactor,
        legW: legW * heightFactor * muscleMassFactor,
      };
    }
    
    return enhancedProps;
  }, [measurements, isFemale, user]);
  
  // View toggle handler
  const toggleView = useCallback(() => {
    setViewMode(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const anchorPoints: AnchorPoint[] = useMemo(() => {
    // Calculate dynamic positions based on body proportions and view mode
    const shoulderEdgeX = shiftedCenterX + (viewMode === 'front' ? bodyProps.shoulderW - 15 : -bodyProps.shoulderW + 15);
    const chestEdgeX = shiftedCenterX + (viewMode === 'front' ? bodyProps.chestW - 10 : -bodyProps.chestW + 10);
    const armX = shiftedCenterX + (viewMode === 'front' ? bodyProps.shoulderW + 15 : -bodyProps.shoulderW - 15);
    const waistEdgeX = shiftedCenterX + (viewMode === 'front' ? bodyProps.waistW - 10 : -bodyProps.waistW + 10);
    const legX = shiftedCenterX + (viewMode === 'front' ? 15 : -15);
    
    return [
      {
        name: 'shoulders',
        x: shoulderEdgeX,
        y: 85,
        value: measurements.shoulders,
        min: 20,
        max: 100,
        color: '#FF7675',
      },
      {
        name: 'chest',
        x: chestEdgeX,
        y: 110,
        value: measurements.chest,
        min: 20,
        max: 100,
        color: '#00CEC9',
      },
      {
        name: 'arms',
        x: armX,
        y: 130,
        value: measurements.arms,
        min: 20,
        max: 100,
        color: '#74B9FF',
      },
      {
        name: 'waist',
        x: waistEdgeX,
        y: 160,
        value: measurements.waist,
        min: 20,
        max: 100,
        color: '#FDCB6E',
      },
      {
        name: 'legs',
        x: legX,
        y: 210,
        value: measurements.legs,
        min: 20,
        max: 100,
        color: '#A29BFE',
      },
    ];
  }, [measurements, shiftedCenterX, bodyProps, viewMode]);

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
    
    if (onMeasurementChange) {
      onMeasurementChange(newMeasurements);
    }
  }, [selectedAnchor, onMeasurementChange, measurements]);
  
  const closeSlider = useCallback(() => {
    setSelectedAnchor(null);
  }, []);

  // Add drag handling for anchor points
  const handleAnchorDrag = useCallback((anchorName: string, deltaX: number) => {
    if (!interactive) return;
    
    const anchor = anchorPoints.find(a => a.name === anchorName);
    if (anchor) {
      // Increased sensitivity for better control
      const sensitivity = 0.8;
      const newValue = Math.min(
        Math.max(anchor.value + deltaX * sensitivity, anchor.min), 
        anchor.max
      );
      
      const newMeasurements = { ...measurements, [anchorName]: newValue };
      setMeasurements(newMeasurements);
      
      // Update the anchor point value as well
      const updatedAnchorPoints = anchorPoints.map(a => 
        a.name === anchorName ? { ...a, value: newValue } : a
      );
      
      if (onMeasurementChange) {
        onMeasurementChange(newMeasurements);
      }
    }
  }, [anchorPoints, interactive, measurements, onMeasurementChange]);

  // Determine scale for comparison mode
  const modelScale = (showComparison || showProgress) ? 0.85 : 1;

  // Render human body based on view mode
  const renderHumanBody = () => {
    const isBackView = viewMode === 'back';
    return (
      <G transform={`translate(0, 30) scale(${modelScale})`}>
        {/* Head - more realistic proportions */}
        <Ellipse
          cx={shiftedCenterX}
          cy={45}
          rx={18}
          ry={22}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Head shadow/depth */}
        <Ellipse
          cx={shiftedCenterX + 2}
          cy={47}
          rx={16}
          ry={20}
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.8"
        />
    
        {/* Hair - more realistic styling */}
        {!isBackView ? (
          <>
            {/* Main hair shape */}
            <Path
              d={`M ${shiftedCenterX - 18} 26 Q ${shiftedCenterX - 22} 20 ${shiftedCenterX - 15} 15 Q ${shiftedCenterX} 12 ${shiftedCenterX + 15} 15 Q ${shiftedCenterX + 22} 20 ${shiftedCenterX + 18} 26 Q ${shiftedCenterX + 20} 35 ${shiftedCenterX + 12} 32 Q ${shiftedCenterX} 20 ${shiftedCenterX - 12} 32 Q ${shiftedCenterX - 20} 35 ${shiftedCenterX - 18} 26`}
              fill="url(#hairGradient)"
              stroke={isFemale ? '#8B4513' : '#654321'}
              strokeWidth="1.2"
            />
            {/* Hair texture lines */}
            <Path d={`M ${shiftedCenterX - 12} 22 Q ${shiftedCenterX - 8} 18 ${shiftedCenterX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
            <Path d={`M ${shiftedCenterX + 4} 22 Q ${shiftedCenterX + 8} 18 ${shiftedCenterX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
          </>
        ) : (
          <>
            {/* Back hair shape */}
            <Ellipse
              cx={shiftedCenterX}
              cy={28}
              rx={20}
              ry={16}
              fill="url(#hairGradient)"
              stroke={isFemale ? '#8B4513' : '#654321'}
              strokeWidth="1.2"
            />
            {/* Hair whorl/crown */}
            <Circle cx={shiftedCenterX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </>
        )}
        
        {/* Enhanced female hair for front view */}
        {isFemale && !isBackView && (
          <>
            <Path
              d={`M ${shiftedCenterX - 16} 30 Q ${shiftedCenterX - 24} 42 ${shiftedCenterX - 18} 58 Q ${shiftedCenterX - 12} 62 ${shiftedCenterX - 8} 58 Q ${shiftedCenterX - 6} 52 ${shiftedCenterX - 8} 48`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1"
              opacity={0.85}
            />
            <Path
              d={`M ${shiftedCenterX + 16} 30 Q ${shiftedCenterX + 24} 42 ${shiftedCenterX + 18} 58 Q ${shiftedCenterX + 12} 62 ${shiftedCenterX + 8} 58 Q ${shiftedCenterX + 6} 52 ${shiftedCenterX + 8} 48`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1"
              opacity={0.85}
            />
          </>
        )}
    
        {/* Neck - more anatomical */}
        <Path
          d={`M ${shiftedCenterX - 5} 67 Q ${shiftedCenterX} 65 ${shiftedCenterX + 5} 67 L ${shiftedCenterX + 6} 78 Q ${shiftedCenterX} 80 ${shiftedCenterX - 6} 78 Z`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1"
        />
        
        {/* Neck shadow */}
        <Line x1={shiftedCenterX - 3} y1={72} x2={shiftedCenterX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    
        {/* Shoulders - more realistic trapezius shape */}
        <Path
          d={`M ${shiftedCenterX - bodyProps.shoulderW} 78 Q ${shiftedCenterX - bodyProps.shoulderW - 5} 85 ${shiftedCenterX - bodyProps.shoulderW + 5} 92 L ${shiftedCenterX + bodyProps.shoulderW - 5} 92 Q ${shiftedCenterX + bodyProps.shoulderW + 5} 85 ${shiftedCenterX + bodyProps.shoulderW} 78 Q ${shiftedCenterX} 75 ${shiftedCenterX - bodyProps.shoulderW} 78`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Shoulder muscle definition */}
        <Path d={`M ${shiftedCenterX - bodyProps.shoulderW + 8} 85 Q ${shiftedCenterX - 15} 82 ${shiftedCenterX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        <Path d={`M ${shiftedCenterX + 8} 85 Q ${shiftedCenterX + 15} 82 ${shiftedCenterX + bodyProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
    
        {/* Chest/torso - more anatomical ribcage shape */}
        <Path
          d={`M ${shiftedCenterX - bodyProps.chestW} 95 Q ${shiftedCenterX - bodyProps.chestW - 2} 110 ${shiftedCenterX - bodyProps.chestW + 3} 135 Q ${shiftedCenterX} 138 ${shiftedCenterX + bodyProps.chestW - 3} 135 Q ${shiftedCenterX + bodyProps.chestW + 2} 110 ${shiftedCenterX + bodyProps.chestW} 95 Q ${shiftedCenterX} 92 ${shiftedCenterX - bodyProps.chestW} 95`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Realistic chest definition for males */}
        {!isFemale && !isBackView && (
          <G opacity={0.3}>
            {/* Pectoral muscles */}
            <Path d={`M ${shiftedCenterX - 15} 105 Q ${shiftedCenterX - 8} 100 ${shiftedCenterX - 2} 108 Q ${shiftedCenterX - 8} 115 ${shiftedCenterX - 15} 110 Z`} fill="rgba(135, 206, 235, 0.2)" stroke="#87CEEB" strokeWidth="1" />
            <Path d={`M ${shiftedCenterX + 15} 105 Q ${shiftedCenterX + 8} 100 ${shiftedCenterX + 2} 108 Q ${shiftedCenterX + 8} 115 ${shiftedCenterX + 15} 110 Z`} fill="rgba(135, 206, 235, 0.2)" stroke="#87CEEB" strokeWidth="1" />
            {/* Sternum line */}
            <Line x1={shiftedCenterX} y1={100} x2={shiftedCenterX} y2={130} stroke="rgba(135, 206, 235, 0.3)" strokeWidth="1.2" />
          </G>
        )}
        
        {/* Realistic female chest */}
        {isFemale && !isBackView && (
          <G>
            <Ellipse
              cx={shiftedCenterX - 8}
              cy={108}
              rx={7}
              ry={9}
              fill="rgba(255, 182, 193, 0.15)"
              stroke="#E8B4B8"
              strokeWidth="1.2"
            />
            <Ellipse
              cx={shiftedCenterX + 8}
              cy={108}
              rx={7}
              ry={9}
              fill="rgba(255, 182, 193, 0.15)"
              stroke="#E8B4B8"
              strokeWidth="1.2"
            />
            {/* Subtle shading */}
            <Path d={`M ${shiftedCenterX - 12} 115 Q ${shiftedCenterX - 8} 112 ${shiftedCenterX - 4} 115`} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" fill="none" />
            <Path d={`M ${shiftedCenterX + 4} 115 Q ${shiftedCenterX + 8} 112 ${shiftedCenterX + 12} 115`} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" fill="none" />
          </G>
        )}
    
        {/* Waist - more realistic torso taper */}
        <Path
          d={`M ${shiftedCenterX - bodyProps.waistW} 140 Q ${shiftedCenterX - bodyProps.waistW - 2} 160 ${shiftedCenterX - bodyProps.waistW + 2} 180 Q ${shiftedCenterX} 182 ${shiftedCenterX + bodyProps.waistW - 2} 180 Q ${shiftedCenterX + bodyProps.waistW + 2} 160 ${shiftedCenterX + bodyProps.waistW} 140 Q ${shiftedCenterX} 138 ${shiftedCenterX - bodyProps.waistW} 140`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Enhanced abdominal definition for males */}
        {!isFemale && !isBackView && (
          <G opacity={0.25}>
            <Line x1={shiftedCenterX} y1={145} x2={shiftedCenterX} y2={175} stroke="#87CEEB" strokeWidth="1.5" />
            <Path d={`M ${shiftedCenterX - 8} 150 Q ${shiftedCenterX} 148 ${shiftedCenterX + 8} 150`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            <Path d={`M ${shiftedCenterX - 8} 160 Q ${shiftedCenterX} 158 ${shiftedCenterX + 8} 160`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            <Path d={`M ${shiftedCenterX - 8} 170 Q ${shiftedCenterX} 168 ${shiftedCenterX + 8} 170`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            {/* Obliques */}
            <Path d={`M ${shiftedCenterX - 12} 155 Q ${shiftedCenterX - 8} 160 ${shiftedCenterX - 10} 165`} stroke="#87CEEB" strokeWidth="0.8" fill="none" />
            <Path d={`M ${shiftedCenterX + 12} 155 Q ${shiftedCenterX + 8} 160 ${shiftedCenterX + 10} 165`} stroke="#87CEEB" strokeWidth="0.8" fill="none" />
          </G>
        )}
        
        {/* Enhanced back muscles for back view */}
        {isBackView && (
          <G opacity={0.25}>
            <Line x1={shiftedCenterX} y1={95} x2={shiftedCenterX} y2={175} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.5" />
            {/* Latissimus dorsi */}
            <Path d={`M ${shiftedCenterX - 20} 110 Q ${shiftedCenterX - 8} 105 ${shiftedCenterX - 5} 115 Q ${shiftedCenterX - 12} 125 ${shiftedCenterX - 20} 120 Z`} fill="none" stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.2" />
            <Path d={`M ${shiftedCenterX + 20} 110 Q ${shiftedCenterX + 8} 105 ${shiftedCenterX + 5} 115 Q ${shiftedCenterX + 12} 125 ${shiftedCenterX + 20} 120 Z`} fill="none" stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.2" />
            {/* Rhomboids */}
            <Path d={`M ${shiftedCenterX - 15} 115 Q ${shiftedCenterX} 110 ${shiftedCenterX + 15} 115`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
            <Path d={`M ${shiftedCenterX - 18} 130 Q ${shiftedCenterX} 125 ${shiftedCenterX + 18} 130`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
            {/* Lower back */}
            <Path d={`M ${shiftedCenterX - 15} 150 Q ${shiftedCenterX} 145 ${shiftedCenterX + 15} 150`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
          </G>
        )}
    
        {/* Enhanced female hips with better curves */}
        {isFemale && (
          <Path
            d={`M ${shiftedCenterX - bodyProps.waistW - 8} 175 Q ${shiftedCenterX - bodyProps.waistW - 12} 185 ${shiftedCenterX - bodyProps.waistW - 6} 195 Q ${shiftedCenterX} 198 ${shiftedCenterX + bodyProps.waistW + 6} 195 Q ${shiftedCenterX + bodyProps.waistW + 12} 185 ${shiftedCenterX + bodyProps.waistW + 8} 175 Q ${shiftedCenterX} 172 ${shiftedCenterX - bodyProps.waistW - 8} 175`}
            fill="url(#skinGradient)"
            stroke="#E8B4B8"
            strokeWidth="1.2"
          />
        )}
    
        {/* Arms - more realistic upper arm and forearm structure */}
        <G>
          {/* Left arm - upper arm */}
          <Path
            d={`M ${shiftedCenterX - bodyProps.shoulderW - 5} 95 Q ${shiftedCenterX - bodyProps.shoulderW - 12 - bodyProps.armW} 100 ${shiftedCenterX - bodyProps.shoulderW - 10 - bodyProps.armW} 130 Q ${shiftedCenterX - bodyProps.shoulderW - 6 - bodyProps.armW} 132 ${shiftedCenterX - bodyProps.shoulderW - 2 - bodyProps.armW} 130 Q ${shiftedCenterX - bodyProps.shoulderW - bodyProps.armW} 100 ${shiftedCenterX - bodyProps.shoulderW - 5} 95`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left forearm */}
          <Path
            d={`M ${shiftedCenterX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 132 Q ${shiftedCenterX - bodyProps.shoulderW - 10 - bodyProps.armW/2} 135 ${shiftedCenterX - bodyProps.shoulderW - 9 - bodyProps.armW/2} 165 Q ${shiftedCenterX - bodyProps.shoulderW - 5 - bodyProps.armW/2} 167 ${shiftedCenterX - bodyProps.shoulderW - 3 - bodyProps.armW/2} 165 Q ${shiftedCenterX - bodyProps.shoulderW - 4 - bodyProps.armW/2} 135 ${shiftedCenterX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 132`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left hand */}
          <Ellipse
            cx={shiftedCenterX - bodyProps.shoulderW - 6 - bodyProps.armW/2}
            cy={172}
            rx={5}
            ry={8}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Right arm - upper arm */}
          <Path
            d={`M ${shiftedCenterX + bodyProps.shoulderW + 5} 95 Q ${shiftedCenterX + bodyProps.shoulderW + 12 + bodyProps.armW} 100 ${shiftedCenterX + bodyProps.shoulderW + 10 + bodyProps.armW} 130 Q ${shiftedCenterX + bodyProps.shoulderW + 6 + bodyProps.armW} 132 ${shiftedCenterX + bodyProps.shoulderW + 2 + bodyProps.armW} 130 Q ${shiftedCenterX + bodyProps.shoulderW + bodyProps.armW} 100 ${shiftedCenterX + bodyProps.shoulderW + 5} 95`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right forearm */}
          <Path
            d={`M ${shiftedCenterX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 132 Q ${shiftedCenterX + bodyProps.shoulderW + 10 + bodyProps.armW/2} 135 ${shiftedCenterX + bodyProps.shoulderW + 9 + bodyProps.armW/2} 165 Q ${shiftedCenterX + bodyProps.shoulderW + 5 + bodyProps.armW/2} 167 ${shiftedCenterX + bodyProps.shoulderW + 3 + bodyProps.armW/2} 165 Q ${shiftedCenterX + bodyProps.shoulderW + 4 + bodyProps.armW/2} 135 ${shiftedCenterX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 132`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right hand */}
          <Ellipse
            cx={shiftedCenterX + bodyProps.shoulderW + 6 + bodyProps.armW/2}
            cy={172}
            rx={5}
            ry={8}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Muscle definition for arms */}
          {!isFemale && !isBackView && (
            <G opacity={0.2}>
              <Path d={`M ${shiftedCenterX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 110 Q ${shiftedCenterX - bodyProps.shoulderW - 6 - bodyProps.armW/2} 108 ${shiftedCenterX - bodyProps.shoulderW - 4 - bodyProps.armW/2} 110`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${shiftedCenterX + bodyProps.shoulderW + 4 + bodyProps.armW/2} 110 Q ${shiftedCenterX + bodyProps.shoulderW + 6 + bodyProps.armW/2} 108 ${shiftedCenterX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 110`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
            </G>
          )}
        </G>
    
        {/* Legs - more realistic thigh and calf structure */}
        <G>
          {/* Left thigh */}
          <Path
            d={`M ${shiftedCenterX - 15} 185 Q ${shiftedCenterX - 18 - bodyProps.legW} 190 ${shiftedCenterX - 16 - bodyProps.legW} 240 Q ${shiftedCenterX - 12 - bodyProps.legW} 242 ${shiftedCenterX - 8 - bodyProps.legW} 240 Q ${shiftedCenterX - 10 - bodyProps.legW} 190 ${shiftedCenterX - 15} 185`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left calf */}
          <Path
            d={`M ${shiftedCenterX - 14 - bodyProps.legW/2} 242 Q ${shiftedCenterX - 16 - bodyProps.legW/2} 245 ${shiftedCenterX - 14 - bodyProps.legW/2} 295 Q ${shiftedCenterX - 10 - bodyProps.legW/2} 297 ${shiftedCenterX - 6 - bodyProps.legW/2} 295 Q ${shiftedCenterX - 8 - bodyProps.legW/2} 245 ${shiftedCenterX - 14 - bodyProps.legW/2} 242`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left foot */}
          <Ellipse
            cx={shiftedCenterX - 10 - bodyProps.legW/2}
            cy={302}
            rx={12}
            ry={6}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Right thigh */}
          <Path
            d={`M ${shiftedCenterX + 15} 185 Q ${shiftedCenterX + 18 + bodyProps.legW} 190 ${shiftedCenterX + 16 + bodyProps.legW} 240 Q ${shiftedCenterX + 12 + bodyProps.legW} 242 ${shiftedCenterX + 8 + bodyProps.legW} 240 Q ${shiftedCenterX + 10 + bodyProps.legW} 190 ${shiftedCenterX + 15} 185`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right calf */}
          <Path
            d={`M ${shiftedCenterX + 14 + bodyProps.legW/2} 242 Q ${shiftedCenterX + 16 + bodyProps.legW/2} 245 ${shiftedCenterX + 14 + bodyProps.legW/2} 295 Q ${shiftedCenterX + 10 + bodyProps.legW/2} 297 ${shiftedCenterX + 6 + bodyProps.legW/2} 295 Q ${shiftedCenterX + 8 + bodyProps.legW/2} 245 ${shiftedCenterX + 14 + bodyProps.legW/2} 242`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right foot */}
          <Ellipse
            cx={shiftedCenterX + 10 + bodyProps.legW/2}
            cy={302}
            rx={12}
            ry={6}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Leg muscle definition */}
          {!isFemale && !isBackView && (
            <G opacity={0.2}>
              {/* Quadriceps lines */}
              <Path d={`M ${shiftedCenterX - 12 - bodyProps.legW/2} 210 Q ${shiftedCenterX - 10 - bodyProps.legW/2} 208 ${shiftedCenterX - 8 - bodyProps.legW/2} 210`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${shiftedCenterX + 8 + bodyProps.legW/2} 210 Q ${shiftedCenterX + 10 + bodyProps.legW/2} 208 ${shiftedCenterX + 12 + bodyProps.legW/2} 210`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              {/* Calf definition */}
              <Path d={`M ${shiftedCenterX - 12 - bodyProps.legW/2} 265 Q ${shiftedCenterX - 10 - bodyProps.legW/2} 263 ${shiftedCenterX - 8 - bodyProps.legW/2} 265`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${shiftedCenterX + 8 + bodyProps.legW/2} 265 Q ${shiftedCenterX + 10 + bodyProps.legW/2} 263 ${shiftedCenterX + 12 + bodyProps.legW/2} 265`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
            </G>
          )}
        </G>
    
        {/* Enhanced face features - only for front view */}
        {!isBackView && (
          <G opacity={0.9}>
            {/* Eyes with more detail */}
            <Ellipse cx={shiftedCenterX - 5} cy={42} rx={3} ry={2} fill="white" />
            <Circle cx={shiftedCenterX - 5} cy={42} r={1.8} fill="#4A90E2" />
            <Circle cx={shiftedCenterX - 5} cy={42} r={1} fill="#2C3E50" />
            <Circle cx={shiftedCenterX - 5} cy={41.5} r={0.3} fill="white" opacity={0.8} />
            
            <Ellipse cx={shiftedCenterX + 5} cy={42} rx={3} ry={2} fill="white" />
            <Circle cx={shiftedCenterX + 5} cy={42} r={1.8} fill="#4A90E2" />
            <Circle cx={shiftedCenterX + 5} cy={42} r={1} fill="#2C3E50" />
            <Circle cx={shiftedCenterX + 5} cy={41.5} r={0.3} fill="white" opacity={0.8} />
            
            {/* Eyelashes */}
            <Path d={`M ${shiftedCenterX - 7} 40.5 L ${shiftedCenterX - 6.5} 39.8 M ${shiftedCenterX - 4.5} 39.8 L ${shiftedCenterX - 4} 40.5 M ${shiftedCenterX - 2.5} 40.5 L ${shiftedCenterX - 3} 39.8`} stroke="#2C3E50" strokeWidth="0.5" />
            <Path d={`M ${shiftedCenterX + 3} 39.8 L ${shiftedCenterX + 2.5} 40.5 M ${shiftedCenterX + 4.5} 40.5 L ${shiftedCenterX + 4} 39.8 M ${shiftedCenterX + 6.5} 39.8 L ${shiftedCenterX + 7} 40.5`} stroke="#2C3E50" strokeWidth="0.5" />
            
            {/* Eyebrows with texture */}
            <Path d={`M ${shiftedCenterX - 8} 38.5 Q ${shiftedCenterX - 5} 37 ${shiftedCenterX - 2} 38.5`} stroke="#654321" strokeWidth="1.5" fill="none" />
            <Path d={`M ${shiftedCenterX + 2} 38.5 Q ${shiftedCenterX + 5} 37 ${shiftedCenterX + 8} 38.5`} stroke="#654321" strokeWidth="1.5" fill="none" />
            
            {/* Nose with nostrils */}
            <Path d={`M ${shiftedCenterX} 46 Q ${shiftedCenterX - 1} 49 ${shiftedCenterX} 52 Q ${shiftedCenterX + 1} 49 ${shiftedCenterX} 46`} fill="rgba(0,0,0,0.06)" />
            <Ellipse cx={shiftedCenterX - 1.2} cy={50.5} rx={0.8} ry={0.6} fill="rgba(0,0,0,0.2)" />
            <Ellipse cx={shiftedCenterX + 1.2} cy={50.5} rx={0.8} ry={0.6} fill="rgba(0,0,0,0.2)" />
            
            {/* Mouth with lips */}
            <Path d={`M ${shiftedCenterX - 3.5} 54.5 Q ${shiftedCenterX} 56.5 ${shiftedCenterX + 3.5} 54.5`} stroke="#CD5C5C" strokeWidth="1.8" fill="none" />
            <Path d={`M ${shiftedCenterX - 3.5} 54.5 Q ${shiftedCenterX} 53.5 ${shiftedCenterX + 3.5} 54.5`} stroke="rgba(205, 92, 92, 0.5)" strokeWidth="1" fill="none" />
            
            {/* Subtle facial contours */}
            <Path d={`M ${shiftedCenterX - 12} 50 Q ${shiftedCenterX - 8} 52 ${shiftedCenterX - 10} 58`} stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
            <Path d={`M ${shiftedCenterX + 12} 50 Q ${shiftedCenterX + 8} 52 ${shiftedCenterX + 10} 58`} stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
          </G>
        )}
      </G>
    );
  };

  // Render comparison with divider line (for goals or progress)
  const renderComparisonWithDivider = () => {
    if (showProgress && progressMeasurements) {
      return renderProgressComparison();
    }
    if (!showComparison || !goalMeasurements) return null;
    
    const goalProps = {
      shoulderW: (goalMeasurements.shoulders / 50) * (isFemale ? 35 : 45),
      chestW: (goalMeasurements.chest / 50) * (isFemale ? 32 : 40),
      waistW: (goalMeasurements.waist / 50) * (isFemale ? 28 : 35),
      armW: (goalMeasurements.arms / 50) * (isFemale ? 8 : 12),
      legW: (goalMeasurements.legs / 50) * (isFemale ? 15 : 20),
    };
    
    // In comparison mode, increase the separation between current and goal models
    const goalCenterX = shiftedCenterX + 200; // move goal model 20px more right
    const dividerX = shiftedCenterX + 70; // move divider 20px more left
    
    return (
      <G>
        {/* Render current model (filled, solid) on the left */}
        {renderHumanBody()}

        {/* Thick divider line */}
        <Line 
          x1={dividerX} 
          y1={20} 
          x2={dividerX} 
          y2={320} 
          stroke={Colors.dark.accent} 
          strokeWidth="4" 
          strokeDasharray="8,4"
        />
        
        {/* VS text */}
        <SvgText 
          x={dividerX} 
          y={170} 
          textAnchor="middle" 
          fill={Colors.dark.accent} 
          fontSize="16" 
          fontWeight="bold"
        >
          VS
        </SvgText>
        
        {/* Goal body - same structure as current body but with goal measurements */}
        <G transform={`translate(${goalCenterX - shiftedCenterX - 40}, 30) scale(${modelScale})`}>
          {/* Head - more realistic proportions */}
          <Ellipse
            cx={shiftedCenterX}
            cy={45}
            rx={18}
            ry={22}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Head shadow/depth */}
          <Ellipse
            cx={shiftedCenterX + 2}
            cy={47}
            rx={16}
            ry={20}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.8"
            strokeDasharray="3,3"
          />
      
          {/* Hair - more realistic styling */}
          {viewMode === 'front' ? (
            <>
              {/* Main hair shape */}
              <Path
                d={`M ${shiftedCenterX - 18} 26 Q ${shiftedCenterX - 22} 20 ${shiftedCenterX - 15} 15 Q ${shiftedCenterX} 12 ${shiftedCenterX + 15} 15 Q ${shiftedCenterX + 22} 20 ${shiftedCenterX + 18} 26 Q ${shiftedCenterX + 20} 35 ${shiftedCenterX + 12} 32 Q ${shiftedCenterX} 20 ${shiftedCenterX - 12} 32 Q ${shiftedCenterX - 20} 35 ${shiftedCenterX - 18} 26`}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              {/* Hair texture lines */}
              <Path d={`M ${shiftedCenterX - 12} 22 Q ${shiftedCenterX - 8} 18 ${shiftedCenterX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="3,3" />
              <Path d={`M ${shiftedCenterX + 4} 22 Q ${shiftedCenterX + 8} 18 ${shiftedCenterX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="3,3" />
            </>
          ) : (
            <>
              {/* Back hair shape */}
              <Ellipse
                cx={shiftedCenterX}
                cy={28}
                rx={20}
                ry={16}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              {/* Hair whorl/crown */}
              <Circle cx={shiftedCenterX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            </>
          )}
          
          {/* Enhanced female hair for front view */}
          {isFemale && viewMode === 'front' && (
            <>
              <Path
                d={`M ${shiftedCenterX - 16} 30 Q ${shiftedCenterX - 24} 42 ${shiftedCenterX - 18} 58 Q ${shiftedCenterX - 12} 62 ${shiftedCenterX - 8} 58 Q ${shiftedCenterX - 6} 52 ${shiftedCenterX - 8} 48`}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="1"
                opacity={0.85}
                strokeDasharray="3,3"
              />
              <Path
                d={`M ${shiftedCenterX + 16} 30 Q ${shiftedCenterX + 24} 42 ${shiftedCenterX + 18} 58 Q ${shiftedCenterX + 12} 62 ${shiftedCenterX + 8} 58 Q ${shiftedCenterX + 6} 52 ${shiftedCenterX + 8} 48`}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="1"
                opacity={0.85}
                strokeDasharray="3,3"
              />
            </>
          )}
      
          {/* Neck - more anatomical */}
          <Path
            d={`M ${shiftedCenterX - 5} 67 Q ${shiftedCenterX} 65 ${shiftedCenterX + 5} 67 L ${shiftedCenterX + 6} 78 Q ${shiftedCenterX} 80 ${shiftedCenterX - 6} 78 Z`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Neck shadow */}
          <Line x1={shiftedCenterX - 3} y1={72} x2={shiftedCenterX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="3,3" />
      
          {/* Shoulders - more realistic trapezius shape */}
          <Path
            d={`M ${shiftedCenterX - goalProps.shoulderW} 78 Q ${shiftedCenterX - goalProps.shoulderW - 5} 85 ${shiftedCenterX - goalProps.shoulderW + 5} 92 L ${shiftedCenterX + goalProps.shoulderW - 5} 92 Q ${shiftedCenterX + goalProps.shoulderW + 5} 85 ${shiftedCenterX + goalProps.shoulderW} 78 Q ${shiftedCenterX} 75 ${shiftedCenterX - goalProps.shoulderW} 78`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Shoulder muscle definition */}
          <Path d={`M ${shiftedCenterX - goalProps.shoulderW + 8} 85 Q ${shiftedCenterX - 15} 82 ${shiftedCenterX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
          <Path d={`M ${shiftedCenterX + 8} 85 Q ${shiftedCenterX + 15} 82 ${shiftedCenterX + goalProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
      
          {/* Chest/torso - more anatomical ribcage shape */}
          <Path
            d={`M ${shiftedCenterX - goalProps.chestW} 95 Q ${shiftedCenterX - goalProps.chestW - 2} 110 ${shiftedCenterX - goalProps.chestW + 3} 135 Q ${shiftedCenterX} 138 ${shiftedCenterX + goalProps.chestW - 3} 135 Q ${shiftedCenterX + goalProps.chestW + 2} 110 ${shiftedCenterX + goalProps.chestW} 95 Q ${shiftedCenterX} 92 ${shiftedCenterX - goalProps.chestW} 95`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
      
          {/* Waist - more realistic torso taper */}
          <Path
            d={`M ${shiftedCenterX - goalProps.waistW} 140 Q ${shiftedCenterX - goalProps.waistW - 2} 160 ${shiftedCenterX - goalProps.waistW + 2} 180 Q ${shiftedCenterX} 182 ${shiftedCenterX + goalProps.waistW - 2} 180 Q ${shiftedCenterX + goalProps.waistW + 2} 160 ${shiftedCenterX + goalProps.waistW} 140 Q ${shiftedCenterX} 138 ${shiftedCenterX - goalProps.waistW} 140`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Enhanced female hips with better curves */}
          {isFemale && (
            <Path
              d={`M ${shiftedCenterX - goalProps.waistW - 8} 175 Q ${shiftedCenterX - goalProps.waistW - 12} 185 ${shiftedCenterX - goalProps.waistW - 6} 195 Q ${shiftedCenterX} 198 ${shiftedCenterX + goalProps.waistW + 6} 195 Q ${shiftedCenterX + goalProps.waistW + 12} 185 ${shiftedCenterX + goalProps.waistW + 8} 175 Q ${shiftedCenterX} 172 ${shiftedCenterX - goalProps.waistW - 8} 175`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          )}
      
          {/* Arms - more realistic upper arm and forearm structure */}
          <G>
            {/* Left arm - upper arm */}
            <Path
              d={`M ${shiftedCenterX - goalProps.shoulderW - 5} 95 Q ${shiftedCenterX - goalProps.shoulderW - 12 - goalProps.armW} 100 ${shiftedCenterX - goalProps.shoulderW - 10 - goalProps.armW} 130 Q ${shiftedCenterX - goalProps.shoulderW - 6 - goalProps.armW} 132 ${shiftedCenterX - goalProps.shoulderW - 2 - goalProps.armW} 130 Q ${shiftedCenterX - goalProps.shoulderW - goalProps.armW} 100 ${shiftedCenterX - goalProps.shoulderW - 5} 95`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left forearm */}
            <Path
              d={`M ${shiftedCenterX - goalProps.shoulderW - 8 - goalProps.armW/2} 132 Q ${shiftedCenterX - goalProps.shoulderW - 10 - goalProps.armW/2} 135 ${shiftedCenterX - goalProps.shoulderW - 9 - goalProps.armW/2} 165 Q ${shiftedCenterX - goalProps.shoulderW - 5 - goalProps.armW/2} 167 ${shiftedCenterX - goalProps.shoulderW - 3 - goalProps.armW/2} 165 Q ${shiftedCenterX - goalProps.shoulderW - 4 - goalProps.armW/2} 135 ${shiftedCenterX - goalProps.shoulderW - 8 - goalProps.armW/2} 132`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left hand */}
            <Ellipse
              cx={shiftedCenterX - goalProps.shoulderW - 6 - goalProps.armW/2}
              cy={172}
              rx={5}
              ry={8}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right arm - upper arm */}
            <Path
              d={`M ${shiftedCenterX + goalProps.shoulderW + 5} 95 Q ${shiftedCenterX + goalProps.shoulderW + 12 + goalProps.armW} 100 ${shiftedCenterX + goalProps.shoulderW + 10 + goalProps.armW} 130 Q ${shiftedCenterX + goalProps.shoulderW + 6 + goalProps.armW} 132 ${shiftedCenterX + goalProps.shoulderW + 2 + goalProps.armW} 130 Q ${shiftedCenterX + goalProps.shoulderW + goalProps.armW} 100 ${shiftedCenterX + goalProps.shoulderW + 5} 95`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right forearm */}
            <Path
              d={`M ${shiftedCenterX + goalProps.shoulderW + 8 + goalProps.armW/2} 132 Q ${shiftedCenterX + goalProps.shoulderW + 10 + goalProps.armW/2} 135 ${shiftedCenterX + goalProps.shoulderW + 9 + goalProps.armW/2} 165 Q ${shiftedCenterX + goalProps.shoulderW + 5 + goalProps.armW/2} 167 ${shiftedCenterX + goalProps.shoulderW + 3 + goalProps.armW/2} 165 Q ${shiftedCenterX + goalProps.shoulderW + 4 + goalProps.armW/2} 135 ${shiftedCenterX + goalProps.shoulderW + 8 + goalProps.armW/2} 132`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right hand */}
            <Ellipse
              cx={shiftedCenterX + goalProps.shoulderW + 6 + goalProps.armW/2}
              cy={172}
              rx={5}
              ry={8}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          </G>
      
          {/* Legs - more realistic thigh and calf structure */}
          <G>
            {/* Left thigh */}
            <Path
              d={`M ${shiftedCenterX - 15} 185 Q ${shiftedCenterX - 18 - goalProps.legW} 190 ${shiftedCenterX - 16 - goalProps.legW} 240 Q ${shiftedCenterX - 12 - goalProps.legW} 242 ${shiftedCenterX - 8 - goalProps.legW} 240 Q ${shiftedCenterX - 10 - goalProps.legW} 190 ${shiftedCenterX - 15} 185`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left calf */}
            <Path
              d={`M ${shiftedCenterX - 14 - goalProps.legW/2} 242 Q ${shiftedCenterX - 16 - goalProps.legW/2} 245 ${shiftedCenterX - 14 - goalProps.legW/2} 295 Q ${shiftedCenterX - 10 - goalProps.legW/2} 297 ${shiftedCenterX - 6 - goalProps.legW/2} 295 Q ${shiftedCenterX - 8 - goalProps.legW/2} 245 ${shiftedCenterX - 14 - goalProps.legW/2} 242`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left foot */}
            <Ellipse
              cx={shiftedCenterX - 10 - goalProps.legW/2}
              cy={302}
              rx={12}
              ry={6}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right thigh */}
            <Path
              d={`M ${shiftedCenterX + 15} 185 Q ${shiftedCenterX + 18 + goalProps.legW} 190 ${shiftedCenterX + 16 + goalProps.legW} 240 Q ${shiftedCenterX + 12 + goalProps.legW} 242 ${shiftedCenterX + 8 + goalProps.legW} 240 Q ${shiftedCenterX + 10 + goalProps.legW} 190 ${shiftedCenterX + 15} 185`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right calf */}
            <Path
              d={`M ${shiftedCenterX + 14 + goalProps.legW/2} 242 Q ${shiftedCenterX + 16 + goalProps.legW/2} 245 ${shiftedCenterX + 14 + goalProps.legW/2} 295 Q ${shiftedCenterX + 10 + goalProps.legW/2} 297 ${shiftedCenterX + 6 + goalProps.legW/2} 295 Q ${shiftedCenterX + 8 + goalProps.legW/2} 245 ${shiftedCenterX + 14 + goalProps.legW/2} 242`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right foot */}
            <Ellipse
              cx={shiftedCenterX + 10 + goalProps.legW/2}
              cy={302}
              rx={12}
              ry={6}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          </G>
        </G>
        
        {/* Labels */}
        <SvgText x={shiftedCenterX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
          {showProgress ? 'Before' : 'Current'}
        </SvgText>
        <SvgText x={goalCenterX} y={325} textAnchor="middle" fill={Colors.dark.accent} fontSize="13" fontWeight="bold">
          {showProgress ? 'After' : 'Goal'}
        </SvgText>
      </G>
    );
  };

  // Render progress comparison (before vs after workout completion)
  const renderProgressComparison = () => {
    if (!showProgress || !progressMeasurements) return null;
    
    const progressProps = {
      shoulderW: (progressMeasurements.shoulders / 50) * (isFemale ? 35 : 45),
      chestW: (progressMeasurements.chest / 50) * (isFemale ? 32 : 40),
      waistW: (progressMeasurements.waist / 50) * (isFemale ? 28 : 35),
      armW: (progressMeasurements.arms / 50) * (isFemale ? 8 : 12),
      legW: (progressMeasurements.legs / 50) * (isFemale ? 15 : 20),
    };
    
    const afterCenterX = shiftedCenterX + 140;
    const dividerX = shiftedCenterX + 70;
    
    return (
      <G>
        {/* Render current model (filled, solid) on the left */}
        {renderHumanBody()}

        {/* Thick divider line */}
        <Line 
          x1={dividerX} 
          y1={20} 
          x2={dividerX} 
          y2={320} 
          stroke={Colors.dark.accent} 
          strokeWidth="4" 
          strokeDasharray="8,4"
        />
        
        {/* Progress indicator */}
        <SvgText 
          x={dividerX} 
          y={170} 
          textAnchor="middle" 
          fill={Colors.dark.accent} 
          fontSize="16" 
          fontWeight="bold"
        >
          ➜
        </SvgText>
        
        {/* After workout body - with enhanced/improved proportions */}
        <G transform={`translate(${afterCenterX - shiftedCenterX}, 0)`}>
          {/* Head - more realistic proportions */}
          <Ellipse
            cx={shiftedCenterX}
            cy={45}
            rx={18}
            ry={22}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Head shadow/depth */}
          <Ellipse
            cx={shiftedCenterX + 2}
            cy={47}
            rx={16}
            ry={20}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.8"
          />
      
          {/* Hair - more realistic styling */}
          {viewMode === 'front' ? (
            <>
              {/* Main hair shape */}
              <Path
                d={`M ${shiftedCenterX - 18} 26 Q ${shiftedCenterX - 22} 20 ${shiftedCenterX - 15} 15 Q ${shiftedCenterX} 12 ${shiftedCenterX + 15} 15 Q ${shiftedCenterX + 22} 20 ${shiftedCenterX + 18} 26 Q ${shiftedCenterX + 20} 35 ${shiftedCenterX + 12} 32 Q ${shiftedCenterX} 20 ${shiftedCenterX - 12} 32 Q ${shiftedCenterX - 20} 35 ${shiftedCenterX - 18} 26`}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#8B4513' : '#654321'}
                strokeWidth="1.2"
              />
              {/* Hair texture lines */}
              <Path d={`M ${shiftedCenterX - 12} 22 Q ${shiftedCenterX - 8} 18 ${shiftedCenterX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
              <Path d={`M ${shiftedCenterX + 4} 22 Q ${shiftedCenterX + 8} 18 ${shiftedCenterX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
            </>
          ) : (
            <>
              {/* Back hair shape */}
              <Ellipse
                cx={shiftedCenterX}
                cy={28}
                rx={20}
                ry={16}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#8B4513' : '#654321'}
                strokeWidth="1.2"
              />
              {/* Hair whorl/crown */}
              <Circle cx={shiftedCenterX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            </>
          )}
          
          {/* Enhanced female hair for front view */}
          {isFemale && viewMode === 'front' && (
            <>
              <Path
                d={`M ${shiftedCenterX - 16} 30 Q ${shiftedCenterX - 24} 42 ${shiftedCenterX - 18} 58 Q ${shiftedCenterX - 12} 62 ${shiftedCenterX - 8} 58 Q ${shiftedCenterX - 6} 52 ${shiftedCenterX - 8} 48`}
                fill="url(#hairGradient)"
                stroke="#8B4513"
                strokeWidth="1"
                opacity={0.85}
              />
              <Path
                d={`M ${shiftedCenterX + 16} 30 Q ${shiftedCenterX + 24} 42 ${shiftedCenterX + 18} 58 Q ${shiftedCenterX + 12} 62 ${shiftedCenterX + 8} 58 Q ${shiftedCenterX + 6} 52 ${shiftedCenterX + 8} 48`}
                fill="url(#hairGradient)"
                stroke="#8B4513"
                strokeWidth="1"
                opacity={0.85}
              />
            </>
          )}
      
          {/* Neck - more anatomical */}
          <Path
            d={`M ${shiftedCenterX - 5} 67 Q ${shiftedCenterX} 65 ${shiftedCenterX + 5} 67 L ${shiftedCenterX + 6} 78 Q ${shiftedCenterX} 80 ${shiftedCenterX - 6} 78 Z`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1"
          />
          
          {/* Neck shadow */}
          <Line x1={shiftedCenterX - 3} y1={72} x2={shiftedCenterX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      
          {/* Shoulders - more realistic trapezius shape */}
          <Path
            d={`M ${shiftedCenterX - progressProps.shoulderW} 78 Q ${shiftedCenterX - progressProps.shoulderW - 5} 85 ${shiftedCenterX - progressProps.shoulderW + 5} 92 L ${shiftedCenterX + progressProps.shoulderW - 5} 92 Q ${shiftedCenterX + progressProps.shoulderW + 5} 85 ${shiftedCenterX + progressProps.shoulderW} 78 Q ${shiftedCenterX} 75 ${shiftedCenterX - progressProps.shoulderW} 78`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Shoulder muscle definition */}
          <Path d={`M ${shiftedCenterX - progressProps.shoulderW + 8} 85 Q ${shiftedCenterX - 15} 82 ${shiftedCenterX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
          <Path d={`M ${shiftedCenterX + 8} 85 Q ${shiftedCenterX + 15} 82 ${shiftedCenterX + progressProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
      
          {/* Chest/torso - more anatomical ribcage shape */}
          <Path
            d={`M ${shiftedCenterX - progressProps.chestW} 95 Q ${shiftedCenterX - progressProps.chestW - 2} 110 ${shiftedCenterX - progressProps.chestW + 3} 135 Q ${shiftedCenterX} 138 ${shiftedCenterX + progressProps.chestW - 3} 135 Q ${shiftedCenterX + progressProps.chestW + 2} 110 ${shiftedCenterX + progressProps.chestW} 95 Q ${shiftedCenterX} 92 ${shiftedCenterX - progressProps.chestW} 95`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Enhanced muscle definition for progress */}
          {!isFemale && viewMode === 'front' && (
            <G opacity={0.6}>
              <Line x1={shiftedCenterX} y1={95} x2={shiftedCenterX} y2={125} stroke={Colors.dark.accent} strokeWidth="2" />
              <Line x1={shiftedCenterX - 12} y1={102} x2={shiftedCenterX + 12} y2={102} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={shiftedCenterX - 12} y1={112} x2={shiftedCenterX + 12} y2={112} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={shiftedCenterX - 12} y1={122} x2={shiftedCenterX + 12} y2={122} stroke={Colors.dark.accent} strokeWidth="1.5" />
            </G>
          )}
      
          {/* Waist - more realistic torso taper */}
          <Path
            d={`M ${shiftedCenterX - progressProps.waistW} 140 Q ${shiftedCenterX - progressProps.waistW - 2} 160 ${shiftedCenterX - progressProps.waistW + 2} 180 Q ${shiftedCenterX} 182 ${shiftedCenterX + progressProps.waistW - 2} 180 Q ${shiftedCenterX + progressProps.waistW + 2} 160 ${shiftedCenterX + progressProps.waistW} 140 Q ${shiftedCenterX} 138 ${shiftedCenterX - progressProps.waistW} 140`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Enhanced female hips with better curves */}
          {isFemale && (
            <Path
              d={`M ${shiftedCenterX - progressProps.waistW - 8} 175 Q ${shiftedCenterX - progressProps.waistW - 12} 185 ${shiftedCenterX - progressProps.waistW - 6} 195 Q ${shiftedCenterX} 198 ${shiftedCenterX + progressProps.waistW + 6} 195 Q ${shiftedCenterX + progressProps.waistW + 12} 185 ${shiftedCenterX + progressProps.waistW + 8} 175 Q ${shiftedCenterX} 172 ${shiftedCenterX - progressProps.waistW - 8} 175`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
          )}
      
          {/* Arms - more realistic upper arm and forearm structure */}
          <G>
            {/* Left arm - upper arm */}
            <Path
              d={`M ${shiftedCenterX - progressProps.shoulderW - 5} 95 Q ${shiftedCenterX - progressProps.shoulderW - 12 - progressProps.armW} 100 ${shiftedCenterX - progressProps.shoulderW - 10 - progressProps.armW} 130 Q ${shiftedCenterX - progressProps.shoulderW - 6 - progressProps.armW} 132 ${shiftedCenterX - progressProps.shoulderW - 2 - progressProps.armW} 130 Q ${shiftedCenterX - progressProps.shoulderW - progressProps.armW} 100 ${shiftedCenterX - progressProps.shoulderW - 5} 95`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left forearm */}
            <Path
              d={`M ${shiftedCenterX - progressProps.shoulderW - 8 - progressProps.armW/2} 132 Q ${shiftedCenterX - progressProps.shoulderW - 10 - progressProps.armW/2} 135 ${shiftedCenterX - progressProps.shoulderW - 9 - progressProps.armW/2} 165 Q ${shiftedCenterX - progressProps.shoulderW - 5 - progressProps.armW/2} 167 ${shiftedCenterX - progressProps.shoulderW - 3 - progressProps.armW/2} 165 Q ${shiftedCenterX - progressProps.shoulderW - 4 - progressProps.armW/2} 135 ${shiftedCenterX - progressProps.shoulderW - 8 - progressProps.armW/2} 132`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left hand */}
            <Ellipse
              cx={shiftedCenterX - progressProps.shoulderW - 6 - progressProps.armW/2}
              cy={172}
              rx={5}
              ry={8}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
            
            {/* Right arm - upper arm */}
            <Path
              d={`M ${shiftedCenterX + progressProps.shoulderW + 5} 95 Q ${shiftedCenterX + progressProps.shoulderW + 12 + progressProps.armW} 100 ${shiftedCenterX + progressProps.shoulderW + 10 + progressProps.armW} 130 Q ${shiftedCenterX + progressProps.shoulderW + 6 + progressProps.armW} 132 ${shiftedCenterX + progressProps.shoulderW + 2 + progressProps.armW} 130 Q ${shiftedCenterX + progressProps.shoulderW + progressProps.armW} 100 ${shiftedCenterX + progressProps.shoulderW + 5} 95`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right forearm */}
            <Path
              d={`M ${shiftedCenterX + progressProps.shoulderW + 8 + progressProps.armW/2} 132 Q ${shiftedCenterX + progressProps.shoulderW + 10 + progressProps.armW/2} 135 ${shiftedCenterX + progressProps.shoulderW + 9 + progressProps.armW/2} 165 Q ${shiftedCenterX + progressProps.shoulderW + 5 + progressProps.armW/2} 167 ${shiftedCenterX + progressProps.shoulderW + 3 + progressProps.armW/2} 165 Q ${shiftedCenterX + progressProps.shoulderW + 4 + progressProps.armW/2} 135 ${shiftedCenterX + progressProps.shoulderW + 8 + progressProps.armW/2} 132`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right hand */}
            <Ellipse
              cx={shiftedCenterX + progressProps.shoulderW + 6 + progressProps.armW/2}
              cy={172}
              rx={5}
              ry={8}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
          </G>
      
          {/* Legs - more realistic thigh and calf structure */}
          <G>
            {/* Left thigh */}
            <Path
              d={`M ${shiftedCenterX - 15} 185 Q ${shiftedCenterX - 18 - progressProps.legW} 190 ${shiftedCenterX - 16 - progressProps.legW} 240 Q ${shiftedCenterX - 12 - progressProps.legW} 242 ${shiftedCenterX - 8 - progressProps.legW} 240 Q ${shiftedCenterX - 10 - progressProps.legW} 190 ${shiftedCenterX - 15} 185`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left calf */}
            <Path
              d={`M ${shiftedCenterX - 14 - progressProps.legW/2} 242 Q ${shiftedCenterX - 16 - progressProps.legW/2} 245 ${shiftedCenterX - 14 - progressProps.legW/2} 295 Q ${shiftedCenterX - 10 - progressProps.legW/2} 297 ${shiftedCenterX - 6 - progressProps.legW/2} 295 Q ${shiftedCenterX - 8 - progressProps.legW/2} 245 ${shiftedCenterX - 14 - progressProps.legW/2} 242`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left foot */}
            <Ellipse
              cx={shiftedCenterX - 10 - progressProps.legW/2}
              cy={302}
              rx={12}
              ry={6}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
            
            {/* Right thigh */}
            <Path
              d={`M ${shiftedCenterX + 15} 185 Q ${shiftedCenterX + 18 + progressProps.legW} 190 ${shiftedCenterX + 16 + progressProps.legW} 240 Q ${shiftedCenterX + 12 + progressProps.legW} 242 ${shiftedCenterX + 8 + progressProps.legW} 240 Q ${shiftedCenterX + 10 + progressProps.legW} 190 ${shiftedCenterX + 15} 185`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right calf */}
            <Path
              d={`M ${shiftedCenterX + 14 + progressProps.legW/2} 242 Q ${shiftedCenterX + 16 + progressProps.legW/2} 245 ${shiftedCenterX + 14 + progressProps.legW/2} 295 Q ${shiftedCenterX + 10 + progressProps.legW/2} 297 ${shiftedCenterX + 6 + progressProps.legW/2} 295 Q ${shiftedCenterX + 8 + progressProps.legW/2} 245 ${shiftedCenterX + 14 + progressProps.legW/2} 242`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right foot */}
            <Ellipse
              cx={shiftedCenterX + 10 + progressProps.legW/2}
              cy={302}
              rx={12}
              ry={6}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
          </G>
          
          {/* Progress glow effect */}
          <Circle
            cx={shiftedCenterX}
            cy={160}
            r={80}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="1"
            opacity={0.2}
            strokeDasharray="4,8"
          />
        </G>
        
        {/* Labels */}
        <SvgText x={shiftedCenterX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
          Before
        </SvgText>
        <SvgText x={afterCenterX} y={325} textAnchor="middle" fill={Colors.dark.accent} fontSize="13" fontWeight="bold">
          After Workout
        </SvgText>
      </G>
    );
  };

  // Render anchor points
  const renderAnchorPoints = () => {
    if (!interactive) return null;
    
    return anchorPoints.map((anchor) => {
      const isActive = selectedAnchor === anchor.name;
      
      const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setSelectedAnchor(anchor.name);
          setSliderValue(anchor.value);
        },
        onPanResponderMove: (_, gestureState) => {
          handleAnchorDrag(anchor.name, gestureState.dx);
        },
        onPanResponderRelease: () => {
          // Keep selected for slider interaction
        },
      });
      
      return (
        <View
          key={anchor.name}
          style={[
            styles.anchorPoint,
            {
              left: anchor.x - 16,
              top: anchor.y - 16,
              backgroundColor: anchor.color,
              transform: [{ scale: isActive ? 1.2 : 1 }],
              shadowColor: anchor.color,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.anchorLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
          {isActive && <View style={styles.anchorPulse} />}
        </View>
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
    const sliderWidth = 100; // Further reduced size
    
    // Calculate position to keep slider on screen and close to anchor
    let sliderLeft = anchor.x - (sliderWidth / 2);
    let sliderTop = anchor.y - 40; // Even closer to anchor point
    
    // Ensure slider stays within screen bounds with better margins
    if (sliderLeft < 15) sliderLeft = 15;
    if (sliderLeft + sliderWidth > screenWidth - 15) sliderLeft = screenWidth - sliderWidth - 15;
    if (sliderTop < 15) sliderTop = anchor.y + 25; // Move below if too high
    
    return (
      <View style={[
        styles.sliderContainer,
        {
          left: sliderLeft,
          top: sliderTop,
          borderColor: anchor.color,
          width: sliderWidth,
        }
      ]}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{anchor.name.charAt(0).toUpperCase()}</Text>
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
    <View style={[styles.container, style]}>
      <View style={styles.modelContainer}>
        {/* Main SVG container */}
        <View style={styles.svgWrapper}>
          <TouchableOpacity onPress={toggleView} style={styles.svgContainer}>
            <Svg
              width={style?.width || 320}
              height={style?.height || 400}
              viewBox="0 0 320 400"
            >
              {showComparison
                ? renderComparisonWithDivider()
                : showProgress
                  ? renderProgressComparison()
                  : renderHumanBody()}
            </Svg>
          </TouchableOpacity>
          
          {renderAnchorPoints()}
          {renderSlider()}
        </View>
        
        {/* Comparison legend */}
        {(showComparison || showProgress) && (
          <View style={styles.comparisonLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: isFemale ? '#FFB6C1' : '#87CEEB' }]} />
              <Text style={styles.legendText}>{showProgress ? 'Before' : 'Current'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.dark.accent, opacity: 0.6 }]} />
              <Text style={styles.legendText}>{showProgress ? 'After Workout' : 'Goal'}</Text>
            </View>
          </View>
        )}
        
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {showProgress 
              ? '🏆 Your transformation progress after completing the workout plan'
              : '🎯 Tap colored points to adjust • 🔄 Tap model to switch views'
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480, // Increased height for more space
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F1419',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  modelContainer: {
    flex: 1,
    backgroundColor: '#0F1419',
    position: 'relative',
  },
  svgWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 24,
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 12,
    padding: 8,
  },
  comparisonLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  anchorPoint: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  anchorLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  anchorPulse: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.3,
  },
  sliderContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 10,
    zIndex: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    minWidth: 100,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 2,
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sliderButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});