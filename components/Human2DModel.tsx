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
  const initialMeasurements = useMemo(() => ({
    shoulders: user?.currentMeasurements?.shoulders || 50,
    chest: user?.currentMeasurements?.chest || 50,
    arms: user?.currentMeasurements?.arms || 50,
    waist: user?.currentMeasurements?.waist || 50,
    legs: user?.currentMeasurements?.legs || 50,
  }), [user?.currentMeasurements]);
  
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
    const shoulderEdgeX = centerX + (viewMode === 'front' ? bodyProps.shoulderW - 15 : -bodyProps.shoulderW + 15);
    const chestEdgeX = centerX + (viewMode === 'front' ? bodyProps.chestW - 10 : -bodyProps.chestW + 10);
    const armX = centerX + (viewMode === 'front' ? bodyProps.shoulderW + 15 : -bodyProps.shoulderW - 15);
    const waistEdgeX = centerX + (viewMode === 'front' ? bodyProps.waistW - 10 : -bodyProps.waistW + 10);
    const legX = centerX + (viewMode === 'front' ? 15 : -15);
    
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
  }, [measurements, centerX, bodyProps, viewMode]);

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

  // Render human body based on view mode
  const renderHumanBody = () => {
    const isBackView = viewMode === 'back';
    
    return (
      <G>
        {/* Head - more realistic proportions */}
        <Ellipse
          cx={centerX}
          cy={45}
          rx={18}
          ry={22}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Head shadow/depth */}
        <Ellipse
          cx={centerX + 2}
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
              d={`M ${centerX - 18} 26 Q ${centerX - 22} 20 ${centerX - 15} 15 Q ${centerX} 12 ${centerX + 15} 15 Q ${centerX + 22} 20 ${centerX + 18} 26 Q ${centerX + 20} 35 ${centerX + 12} 32 Q ${centerX} 20 ${centerX - 12} 32 Q ${centerX - 20} 35 ${centerX - 18} 26`}
              fill="url(#hairGradient)"
              stroke={isFemale ? '#8B4513' : '#654321'}
              strokeWidth="1.2"
            />
            {/* Hair texture lines */}
            <Path d={`M ${centerX - 12} 22 Q ${centerX - 8} 18 ${centerX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
            <Path d={`M ${centerX + 4} 22 Q ${centerX + 8} 18 ${centerX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
          </>
        ) : (
          <>
            {/* Back hair shape */}
            <Ellipse
              cx={centerX}
              cy={28}
              rx={20}
              ry={16}
              fill="url(#hairGradient)"
              stroke={isFemale ? '#8B4513' : '#654321'}
              strokeWidth="1.2"
            />
            {/* Hair whorl/crown */}
            <Circle cx={centerX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </>
        )}
        
        {/* Enhanced female hair for front view */}
        {isFemale && !isBackView && (
          <>
            <Path
              d={`M ${centerX - 16} 30 Q ${centerX - 24} 42 ${centerX - 18} 58 Q ${centerX - 12} 62 ${centerX - 8} 58 Q ${centerX - 6} 52 ${centerX - 8} 48`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1"
              opacity={0.85}
            />
            <Path
              d={`M ${centerX + 16} 30 Q ${centerX + 24} 42 ${centerX + 18} 58 Q ${centerX + 12} 62 ${centerX + 8} 58 Q ${centerX + 6} 52 ${centerX + 8} 48`}
              fill="url(#hairGradient)"
              stroke="#8B4513"
              strokeWidth="1"
              opacity={0.85}
            />
          </>
        )}
    
        {/* Neck - more anatomical */}
        <Path
          d={`M ${centerX - 5} 67 Q ${centerX} 65 ${centerX + 5} 67 L ${centerX + 6} 78 Q ${centerX} 80 ${centerX - 6} 78 Z`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1"
        />
        
        {/* Neck shadow */}
        <Line x1={centerX - 3} y1={72} x2={centerX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    
        {/* Shoulders - more realistic trapezius shape */}
        <Path
          d={`M ${centerX - bodyProps.shoulderW} 78 Q ${centerX - bodyProps.shoulderW - 5} 85 ${centerX - bodyProps.shoulderW + 5} 92 L ${centerX + bodyProps.shoulderW - 5} 92 Q ${centerX + bodyProps.shoulderW + 5} 85 ${centerX + bodyProps.shoulderW} 78 Q ${centerX} 75 ${centerX - bodyProps.shoulderW} 78`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Shoulder muscle definition */}
        <Path d={`M ${centerX - bodyProps.shoulderW + 8} 85 Q ${centerX - 15} 82 ${centerX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        <Path d={`M ${centerX + 8} 85 Q ${centerX + 15} 82 ${centerX + bodyProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
    
        {/* Chest/torso - more anatomical ribcage shape */}
        <Path
          d={`M ${centerX - bodyProps.chestW} 95 Q ${centerX - bodyProps.chestW - 2} 110 ${centerX - bodyProps.chestW + 3} 135 Q ${centerX} 138 ${centerX + bodyProps.chestW - 3} 135 Q ${centerX + bodyProps.chestW + 2} 110 ${centerX + bodyProps.chestW} 95 Q ${centerX} 92 ${centerX - bodyProps.chestW} 95`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Realistic chest definition for males */}
        {!isFemale && !isBackView && (
          <G opacity={0.3}>
            {/* Pectoral muscles */}
            <Path d={`M ${centerX - 15} 105 Q ${centerX - 8} 100 ${centerX - 2} 108 Q ${centerX - 8} 115 ${centerX - 15} 110 Z`} fill="rgba(135, 206, 235, 0.2)" stroke="#87CEEB" strokeWidth="1" />
            <Path d={`M ${centerX + 15} 105 Q ${centerX + 8} 100 ${centerX + 2} 108 Q ${centerX + 8} 115 ${centerX + 15} 110 Z`} fill="rgba(135, 206, 235, 0.2)" stroke="#87CEEB" strokeWidth="1" />
            {/* Sternum line */}
            <Line x1={centerX} y1={100} x2={centerX} y2={130} stroke="rgba(135, 206, 235, 0.3)" strokeWidth="1.2" />
          </G>
        )}
        
        {/* Realistic female chest */}
        {isFemale && !isBackView && (
          <G>
            <Ellipse
              cx={centerX - 8}
              cy={108}
              rx={7}
              ry={9}
              fill="rgba(255, 182, 193, 0.15)"
              stroke="#E8B4B8"
              strokeWidth="1.2"
            />
            <Ellipse
              cx={centerX + 8}
              cy={108}
              rx={7}
              ry={9}
              fill="rgba(255, 182, 193, 0.15)"
              stroke="#E8B4B8"
              strokeWidth="1.2"
            />
            {/* Subtle shading */}
            <Path d={`M ${centerX - 12} 115 Q ${centerX - 8} 112 ${centerX - 4} 115`} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" fill="none" />
            <Path d={`M ${centerX + 4} 115 Q ${centerX + 8} 112 ${centerX + 12} 115`} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" fill="none" />
          </G>
        )}
    
        {/* Waist - more realistic torso taper */}
        <Path
          d={`M ${centerX - bodyProps.waistW} 140 Q ${centerX - bodyProps.waistW - 2} 160 ${centerX - bodyProps.waistW + 2} 180 Q ${centerX} 182 ${centerX + bodyProps.waistW - 2} 180 Q ${centerX + bodyProps.waistW + 2} 160 ${centerX + bodyProps.waistW} 140 Q ${centerX} 138 ${centerX - bodyProps.waistW} 140`}
          fill="url(#skinGradient)"
          stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
          strokeWidth="1.2"
        />
        
        {/* Enhanced abdominal definition for males */}
        {!isFemale && !isBackView && (
          <G opacity={0.25}>
            <Line x1={centerX} y1={145} x2={centerX} y2={175} stroke="#87CEEB" strokeWidth="1.5" />
            <Path d={`M ${centerX - 8} 150 Q ${centerX} 148 ${centerX + 8} 150`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            <Path d={`M ${centerX - 8} 160 Q ${centerX} 158 ${centerX + 8} 160`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            <Path d={`M ${centerX - 8} 170 Q ${centerX} 168 ${centerX + 8} 170`} stroke="#87CEEB" strokeWidth="1" fill="none" />
            {/* Obliques */}
            <Path d={`M ${centerX - 12} 155 Q ${centerX - 8} 160 ${centerX - 10} 165`} stroke="#87CEEB" strokeWidth="0.8" fill="none" />
            <Path d={`M ${centerX + 12} 155 Q ${centerX + 8} 160 ${centerX + 10} 165`} stroke="#87CEEB" strokeWidth="0.8" fill="none" />
          </G>
        )}
        
        {/* Enhanced back muscles for back view */}
        {isBackView && (
          <G opacity={0.25}>
            <Line x1={centerX} y1={95} x2={centerX} y2={175} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.5" />
            {/* Latissimus dorsi */}
            <Path d={`M ${centerX - 20} 110 Q ${centerX - 8} 105 ${centerX - 5} 115 Q ${centerX - 12} 125 ${centerX - 20} 120 Z`} fill="none" stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.2" />
            <Path d={`M ${centerX + 20} 110 Q ${centerX + 8} 105 ${centerX + 5} 115 Q ${centerX + 12} 125 ${centerX + 20} 120 Z`} fill="none" stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1.2" />
            {/* Rhomboids */}
            <Path d={`M ${centerX - 15} 115 Q ${centerX} 110 ${centerX + 15} 115`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
            <Path d={`M ${centerX - 18} 130 Q ${centerX} 125 ${centerX + 18} 130`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
            {/* Lower back */}
            <Path d={`M ${centerX - 15} 150 Q ${centerX} 145 ${centerX + 15} 150`} stroke={isFemale ? '#E8B4B8' : '#A8C8E8'} strokeWidth="1" fill="none" />
          </G>
        )}
    
        {/* Enhanced female hips with better curves */}
        {isFemale && (
          <Path
            d={`M ${centerX - bodyProps.waistW - 8} 175 Q ${centerX - bodyProps.waistW - 12} 185 ${centerX - bodyProps.waistW - 6} 195 Q ${centerX} 198 ${centerX + bodyProps.waistW + 6} 195 Q ${centerX + bodyProps.waistW + 12} 185 ${centerX + bodyProps.waistW + 8} 175 Q ${centerX} 172 ${centerX - bodyProps.waistW - 8} 175`}
            fill="url(#skinGradient)"
            stroke="#E8B4B8"
            strokeWidth="1.2"
          />
        )}
    
        {/* Arms - more realistic upper arm and forearm structure */}
        <G>
          {/* Left arm - upper arm */}
          <Path
            d={`M ${centerX - bodyProps.shoulderW - 5} 95 Q ${centerX - bodyProps.shoulderW - 12 - bodyProps.armW} 100 ${centerX - bodyProps.shoulderW - 10 - bodyProps.armW} 130 Q ${centerX - bodyProps.shoulderW - 6 - bodyProps.armW} 132 ${centerX - bodyProps.shoulderW - 2 - bodyProps.armW} 130 Q ${centerX - bodyProps.shoulderW - bodyProps.armW} 100 ${centerX - bodyProps.shoulderW - 5} 95`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left forearm */}
          <Path
            d={`M ${centerX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 132 Q ${centerX - bodyProps.shoulderW - 10 - bodyProps.armW/2} 135 ${centerX - bodyProps.shoulderW - 9 - bodyProps.armW/2} 165 Q ${centerX - bodyProps.shoulderW - 5 - bodyProps.armW/2} 167 ${centerX - bodyProps.shoulderW - 3 - bodyProps.armW/2} 165 Q ${centerX - bodyProps.shoulderW - 4 - bodyProps.armW/2} 135 ${centerX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 132`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left hand */}
          <Ellipse
            cx={centerX - bodyProps.shoulderW - 6 - bodyProps.armW/2}
            cy={172}
            rx={5}
            ry={8}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Right arm - upper arm */}
          <Path
            d={`M ${centerX + bodyProps.shoulderW + 5} 95 Q ${centerX + bodyProps.shoulderW + 12 + bodyProps.armW} 100 ${centerX + bodyProps.shoulderW + 10 + bodyProps.armW} 130 Q ${centerX + bodyProps.shoulderW + 6 + bodyProps.armW} 132 ${centerX + bodyProps.shoulderW + 2 + bodyProps.armW} 130 Q ${centerX + bodyProps.shoulderW + bodyProps.armW} 100 ${centerX + bodyProps.shoulderW + 5} 95`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right forearm */}
          <Path
            d={`M ${centerX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 132 Q ${centerX + bodyProps.shoulderW + 10 + bodyProps.armW/2} 135 ${centerX + bodyProps.shoulderW + 9 + bodyProps.armW/2} 165 Q ${centerX + bodyProps.shoulderW + 5 + bodyProps.armW/2} 167 ${centerX + bodyProps.shoulderW + 3 + bodyProps.armW/2} 165 Q ${centerX + bodyProps.shoulderW + 4 + bodyProps.armW/2} 135 ${centerX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 132`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right hand */}
          <Ellipse
            cx={centerX + bodyProps.shoulderW + 6 + bodyProps.armW/2}
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
              <Path d={`M ${centerX - bodyProps.shoulderW - 8 - bodyProps.armW/2} 110 Q ${centerX - bodyProps.shoulderW - 6 - bodyProps.armW/2} 108 ${centerX - bodyProps.shoulderW - 4 - bodyProps.armW/2} 110`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${centerX + bodyProps.shoulderW + 4 + bodyProps.armW/2} 110 Q ${centerX + bodyProps.shoulderW + 6 + bodyProps.armW/2} 108 ${centerX + bodyProps.shoulderW + 8 + bodyProps.armW/2} 110`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
            </G>
          )}
        </G>
    
        {/* Legs - more realistic thigh and calf structure */}
        <G>
          {/* Left thigh */}
          <Path
            d={`M ${centerX - 15} 185 Q ${centerX - 18 - bodyProps.legW} 190 ${centerX - 16 - bodyProps.legW} 240 Q ${centerX - 12 - bodyProps.legW} 242 ${centerX - 8 - bodyProps.legW} 240 Q ${centerX - 10 - bodyProps.legW} 190 ${centerX - 15} 185`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left calf */}
          <Path
            d={`M ${centerX - 14 - bodyProps.legW/2} 242 Q ${centerX - 16 - bodyProps.legW/2} 245 ${centerX - 14 - bodyProps.legW/2} 295 Q ${centerX - 10 - bodyProps.legW/2} 297 ${centerX - 6 - bodyProps.legW/2} 295 Q ${centerX - 8 - bodyProps.legW/2} 245 ${centerX - 14 - bodyProps.legW/2} 242`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Left foot */}
          <Ellipse
            cx={centerX - 10 - bodyProps.legW/2}
            cy={302}
            rx={12}
            ry={6}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1"
          />
          
          {/* Right thigh */}
          <Path
            d={`M ${centerX + 15} 185 Q ${centerX + 18 + bodyProps.legW} 190 ${centerX + 16 + bodyProps.legW} 240 Q ${centerX + 12 + bodyProps.legW} 242 ${centerX + 8 + bodyProps.legW} 240 Q ${centerX + 10 + bodyProps.legW} 190 ${centerX + 15} 185`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right calf */}
          <Path
            d={`M ${centerX + 14 + bodyProps.legW/2} 242 Q ${centerX + 16 + bodyProps.legW/2} 245 ${centerX + 14 + bodyProps.legW/2} 295 Q ${centerX + 10 + bodyProps.legW/2} 297 ${centerX + 6 + bodyProps.legW/2} 295 Q ${centerX + 8 + bodyProps.legW/2} 245 ${centerX + 14 + bodyProps.legW/2} 242`}
            fill="url(#skinGradient)"
            stroke={isFemale ? '#E8B4B8' : '#A8C8E8'}
            strokeWidth="1.2"
          />
          
          {/* Right foot */}
          <Ellipse
            cx={centerX + 10 + bodyProps.legW/2}
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
              <Path d={`M ${centerX - 12 - bodyProps.legW/2} 210 Q ${centerX - 10 - bodyProps.legW/2} 208 ${centerX - 8 - bodyProps.legW/2} 210`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${centerX + 8 + bodyProps.legW/2} 210 Q ${centerX + 10 + bodyProps.legW/2} 208 ${centerX + 12 + bodyProps.legW/2} 210`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              {/* Calf definition */}
              <Path d={`M ${centerX - 12 - bodyProps.legW/2} 265 Q ${centerX - 10 - bodyProps.legW/2} 263 ${centerX - 8 - bodyProps.legW/2} 265`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
              <Path d={`M ${centerX + 8 + bodyProps.legW/2} 265 Q ${centerX + 10 + bodyProps.legW/2} 263 ${centerX + 12 + bodyProps.legW/2} 265`} stroke="#A8C8E8" strokeWidth="1" fill="none" />
            </G>
          )}
        </G>
    
        {/* Enhanced face features - only for front view */}
        {!isBackView && (
          <G opacity={0.9}>
            {/* Eyes with more detail */}
            <Ellipse cx={centerX - 5} cy={42} rx={3} ry={2} fill="white" />
            <Circle cx={centerX - 5} cy={42} r={1.8} fill="#4A90E2" />
            <Circle cx={centerX - 5} cy={42} r={1} fill="#2C3E50" />
            <Circle cx={centerX - 5} cy={41.5} r={0.3} fill="white" opacity={0.8} />
            
            <Ellipse cx={centerX + 5} cy={42} rx={3} ry={2} fill="white" />
            <Circle cx={centerX + 5} cy={42} r={1.8} fill="#4A90E2" />
            <Circle cx={centerX + 5} cy={42} r={1} fill="#2C3E50" />
            <Circle cx={centerX + 5} cy={41.5} r={0.3} fill="white" opacity={0.8} />
            
            {/* Eyelashes */}
            <Path d={`M ${centerX - 7} 40.5 L ${centerX - 6.5} 39.8 M ${centerX - 4.5} 39.8 L ${centerX - 4} 40.5 M ${centerX - 2.5} 40.5 L ${centerX - 3} 39.8`} stroke="#2C3E50" strokeWidth="0.5" />
            <Path d={`M ${centerX + 3} 39.8 L ${centerX + 2.5} 40.5 M ${centerX + 4.5} 40.5 L ${centerX + 4} 39.8 M ${centerX + 6.5} 39.8 L ${centerX + 7} 40.5`} stroke="#2C3E50" strokeWidth="0.5" />
            
            {/* Eyebrows with texture */}
            <Path d={`M ${centerX - 8} 38.5 Q ${centerX - 5} 37 ${centerX - 2} 38.5`} stroke="#654321" strokeWidth="1.5" fill="none" />
            <Path d={`M ${centerX + 2} 38.5 Q ${centerX + 5} 37 ${centerX + 8} 38.5`} stroke="#654321" strokeWidth="1.5" fill="none" />
            
            {/* Nose with nostrils */}
            <Path d={`M ${centerX} 46 Q ${centerX - 1} 49 ${centerX} 52 Q ${centerX + 1} 49 ${centerX} 46`} fill="rgba(0,0,0,0.06)" />
            <Ellipse cx={centerX - 1.2} cy={50.5} rx={0.8} ry={0.6} fill="rgba(0,0,0,0.2)" />
            <Ellipse cx={centerX + 1.2} cy={50.5} rx={0.8} ry={0.6} fill="rgba(0,0,0,0.2)" />
            
            {/* Mouth with lips */}
            <Path d={`M ${centerX - 3.5} 54.5 Q ${centerX} 56.5 ${centerX + 3.5} 54.5`} stroke="#CD5C5C" strokeWidth="1.8" fill="none" />
            <Path d={`M ${centerX - 3.5} 54.5 Q ${centerX} 53.5 ${centerX + 3.5} 54.5`} stroke="rgba(205, 92, 92, 0.5)" strokeWidth="1" fill="none" />
            
            {/* Subtle facial contours */}
            <Path d={`M ${centerX - 12} 50 Q ${centerX - 8} 52 ${centerX - 10} 58`} stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
            <Path d={`M ${centerX + 12} 50 Q ${centerX + 8} 52 ${centerX + 10} 58`} stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
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
    
    const goalCenterX = centerX + 140;
    const dividerX = centerX + 70;
    
    return (
      <G>
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
        <G transform={`translate(${goalCenterX - centerX}, 0)`}>
          {/* Head - more realistic proportions */}
          <Ellipse
            cx={centerX}
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
            cx={centerX + 2}
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
                d={`M ${centerX - 18} 26 Q ${centerX - 22} 20 ${centerX - 15} 15 Q ${centerX} 12 ${centerX + 15} 15 Q ${centerX + 22} 20 ${centerX + 18} 26 Q ${centerX + 20} 35 ${centerX + 12} 32 Q ${centerX} 20 ${centerX - 12} 32 Q ${centerX - 20} 35 ${centerX - 18} 26`}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              {/* Hair texture lines */}
              <Path d={`M ${centerX - 12} 22 Q ${centerX - 8} 18 ${centerX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="3,3" />
              <Path d={`M ${centerX + 4} 22 Q ${centerX + 8} 18 ${centerX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="3,3" />
            </>
          ) : (
            <>
              {/* Back hair shape */}
              <Ellipse
                cx={centerX}
                cy={28}
                rx={20}
                ry={16}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              {/* Hair whorl/crown */}
              <Circle cx={centerX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            </>
          )}
          
          {/* Enhanced female hair for front view */}
          {isFemale && viewMode === 'front' && (
            <>
              <Path
                d={`M ${centerX - 16} 30 Q ${centerX - 24} 42 ${centerX - 18} 58 Q ${centerX - 12} 62 ${centerX - 8} 58 Q ${centerX - 6} 52 ${centerX - 8} 48`}
                fill="none"
                stroke={Colors.dark.accent}
                strokeWidth="1"
                opacity={0.85}
                strokeDasharray="3,3"
              />
              <Path
                d={`M ${centerX + 16} 30 Q ${centerX + 24} 42 ${centerX + 18} 58 Q ${centerX + 12} 62 ${centerX + 8} 58 Q ${centerX + 6} 52 ${centerX + 8} 48`}
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
            d={`M ${centerX - 5} 67 Q ${centerX} 65 ${centerX + 5} 67 L ${centerX + 6} 78 Q ${centerX} 80 ${centerX - 6} 78 Z`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Neck shadow */}
          <Line x1={centerX - 3} y1={72} x2={centerX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="3,3" />
      
          {/* Shoulders - more realistic trapezius shape */}
          <Path
            d={`M ${centerX - goalProps.shoulderW} 78 Q ${centerX - goalProps.shoulderW - 5} 85 ${centerX - goalProps.shoulderW + 5} 92 L ${centerX + goalProps.shoulderW - 5} 92 Q ${centerX + goalProps.shoulderW + 5} 85 ${centerX + goalProps.shoulderW} 78 Q ${centerX} 75 ${centerX - goalProps.shoulderW} 78`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Shoulder muscle definition */}
          <Path d={`M ${centerX - goalProps.shoulderW + 8} 85 Q ${centerX - 15} 82 ${centerX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
          <Path d={`M ${centerX + 8} 85 Q ${centerX + 15} 82 ${centerX + goalProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
      
          {/* Chest/torso - more anatomical ribcage shape */}
          <Path
            d={`M ${centerX - goalProps.chestW} 95 Q ${centerX - goalProps.chestW - 2} 110 ${centerX - goalProps.chestW + 3} 135 Q ${centerX} 138 ${centerX + goalProps.chestW - 3} 135 Q ${centerX + goalProps.chestW + 2} 110 ${centerX + goalProps.chestW} 95 Q ${centerX} 92 ${centerX - goalProps.chestW} 95`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
      
          {/* Waist - more realistic torso taper */}
          <Path
            d={`M ${centerX - goalProps.waistW} 140 Q ${centerX - goalProps.waistW - 2} 160 ${centerX - goalProps.waistW + 2} 180 Q ${centerX} 182 ${centerX + goalProps.waistW - 2} 180 Q ${centerX + goalProps.waistW + 2} 160 ${centerX + goalProps.waistW} 140 Q ${centerX} 138 ${centerX - goalProps.waistW} 140`}
            fill="none"
            stroke={Colors.dark.accent}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Enhanced female hips with better curves */}
          {isFemale && (
            <Path
              d={`M ${centerX - goalProps.waistW - 8} 175 Q ${centerX - goalProps.waistW - 12} 185 ${centerX - goalProps.waistW - 6} 195 Q ${centerX} 198 ${centerX + goalProps.waistW + 6} 195 Q ${centerX + goalProps.waistW + 12} 185 ${centerX + goalProps.waistW + 8} 175 Q ${centerX} 172 ${centerX - goalProps.waistW - 8} 175`}
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
              d={`M ${centerX - goalProps.shoulderW - 5} 95 Q ${centerX - goalProps.shoulderW - 12 - goalProps.armW} 100 ${centerX - goalProps.shoulderW - 10 - goalProps.armW} 130 Q ${centerX - goalProps.shoulderW - 6 - goalProps.armW} 132 ${centerX - goalProps.shoulderW - 2 - goalProps.armW} 130 Q ${centerX - goalProps.shoulderW - goalProps.armW} 100 ${centerX - goalProps.shoulderW - 5} 95`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left forearm */}
            <Path
              d={`M ${centerX - goalProps.shoulderW - 8 - goalProps.armW/2} 132 Q ${centerX - goalProps.shoulderW - 10 - goalProps.armW/2} 135 ${centerX - goalProps.shoulderW - 9 - goalProps.armW/2} 165 Q ${centerX - goalProps.shoulderW - 5 - goalProps.armW/2} 167 ${centerX - goalProps.shoulderW - 3 - goalProps.armW/2} 165 Q ${centerX - goalProps.shoulderW - 4 - goalProps.armW/2} 135 ${centerX - goalProps.shoulderW - 8 - goalProps.armW/2} 132`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left hand */}
            <Ellipse
              cx={centerX - goalProps.shoulderW - 6 - goalProps.armW/2}
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
              d={`M ${centerX + goalProps.shoulderW + 5} 95 Q ${centerX + goalProps.shoulderW + 12 + goalProps.armW} 100 ${centerX + goalProps.shoulderW + 10 + goalProps.armW} 130 Q ${centerX + goalProps.shoulderW + 6 + goalProps.armW} 132 ${centerX + goalProps.shoulderW + 2 + goalProps.armW} 130 Q ${centerX + goalProps.shoulderW + goalProps.armW} 100 ${centerX + goalProps.shoulderW + 5} 95`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right forearm */}
            <Path
              d={`M ${centerX + goalProps.shoulderW + 8 + goalProps.armW/2} 132 Q ${centerX + goalProps.shoulderW + 10 + goalProps.armW/2} 135 ${centerX + goalProps.shoulderW + 9 + goalProps.armW/2} 165 Q ${centerX + goalProps.shoulderW + 5 + goalProps.armW/2} 167 ${centerX + goalProps.shoulderW + 3 + goalProps.armW/2} 165 Q ${centerX + goalProps.shoulderW + 4 + goalProps.armW/2} 135 ${centerX + goalProps.shoulderW + 8 + goalProps.armW/2} 132`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right hand */}
            <Ellipse
              cx={centerX + goalProps.shoulderW + 6 + goalProps.armW/2}
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
              d={`M ${centerX - 15} 185 Q ${centerX - 18 - goalProps.legW} 190 ${centerX - 16 - goalProps.legW} 240 Q ${centerX - 12 - goalProps.legW} 242 ${centerX - 8 - goalProps.legW} 240 Q ${centerX - 10 - goalProps.legW} 190 ${centerX - 15} 185`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left calf */}
            <Path
              d={`M ${centerX - 14 - goalProps.legW/2} 242 Q ${centerX - 16 - goalProps.legW/2} 245 ${centerX - 14 - goalProps.legW/2} 295 Q ${centerX - 10 - goalProps.legW/2} 297 ${centerX - 6 - goalProps.legW/2} 295 Q ${centerX - 8 - goalProps.legW/2} 245 ${centerX - 14 - goalProps.legW/2} 242`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Left foot */}
            <Ellipse
              cx={centerX - 10 - goalProps.legW/2}
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
              d={`M ${centerX + 15} 185 Q ${centerX + 18 + goalProps.legW} 190 ${centerX + 16 + goalProps.legW} 240 Q ${centerX + 12 + goalProps.legW} 242 ${centerX + 8 + goalProps.legW} 240 Q ${centerX + 10 + goalProps.legW} 190 ${centerX + 15} 185`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right calf */}
            <Path
              d={`M ${centerX + 14 + goalProps.legW/2} 242 Q ${centerX + 16 + goalProps.legW/2} 245 ${centerX + 14 + goalProps.legW/2} 295 Q ${centerX + 10 + goalProps.legW/2} 297 ${centerX + 6 + goalProps.legW/2} 295 Q ${centerX + 8 + goalProps.legW/2} 245 ${centerX + 14 + goalProps.legW/2} 242`}
              fill="none"
              stroke={Colors.dark.accent}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* Right foot */}
            <Ellipse
              cx={centerX + 10 + goalProps.legW/2}
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
        <SvgText x={centerX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
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
    
    const afterCenterX = centerX + 140;
    const dividerX = centerX + 70;
    
    return (
      <G>
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
        <G transform={`translate(${afterCenterX - centerX}, 0)`}>
          {/* Head - more realistic proportions */}
          <Ellipse
            cx={centerX}
            cy={45}
            rx={18}
            ry={22}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Head shadow/depth */}
          <Ellipse
            cx={centerX + 2}
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
                d={`M ${centerX - 18} 26 Q ${centerX - 22} 20 ${centerX - 15} 15 Q ${centerX} 12 ${centerX + 15} 15 Q ${centerX + 22} 20 ${centerX + 18} 26 Q ${centerX + 20} 35 ${centerX + 12} 32 Q ${centerX} 20 ${centerX - 12} 32 Q ${centerX - 20} 35 ${centerX - 18} 26`}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#8B4513' : '#654321'}
                strokeWidth="1.2"
              />
              {/* Hair texture lines */}
              <Path d={`M ${centerX - 12} 22 Q ${centerX - 8} 18 ${centerX - 4} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
              <Path d={`M ${centerX + 4} 22 Q ${centerX + 8} 18 ${centerX + 12} 22`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" fill="none" />
            </>
          ) : (
            <>
              {/* Back hair shape */}
              <Ellipse
                cx={centerX}
                cy={28}
                rx={20}
                ry={16}
                fill="url(#hairGradient)"
                stroke={isFemale ? '#8B4513' : '#654321'}
                strokeWidth="1.2"
              />
              {/* Hair whorl/crown */}
              <Circle cx={centerX} cy={28} r={3} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            </>
          )}
          
          {/* Enhanced female hair for front view */}
          {isFemale && viewMode === 'front' && (
            <>
              <Path
                d={`M ${centerX - 16} 30 Q ${centerX - 24} 42 ${centerX - 18} 58 Q ${centerX - 12} 62 ${centerX - 8} 58 Q ${centerX - 6} 52 ${centerX - 8} 48`}
                fill="url(#hairGradient)"
                stroke="#8B4513"
                strokeWidth="1"
                opacity={0.85}
              />
              <Path
                d={`M ${centerX + 16} 30 Q ${centerX + 24} 42 ${centerX + 18} 58 Q ${centerX + 12} 62 ${centerX + 8} 58 Q ${centerX + 6} 52 ${centerX + 8} 48`}
                fill="url(#hairGradient)"
                stroke="#8B4513"
                strokeWidth="1"
                opacity={0.85}
              />
            </>
          )}
      
          {/* Neck - more anatomical */}
          <Path
            d={`M ${centerX - 5} 67 Q ${centerX} 65 ${centerX + 5} 67 L ${centerX + 6} 78 Q ${centerX} 80 ${centerX - 6} 78 Z`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1"
          />
          
          {/* Neck shadow */}
          <Line x1={centerX - 3} y1={72} x2={centerX + 3} y2={72} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      
          {/* Shoulders - more realistic trapezius shape */}
          <Path
            d={`M ${centerX - progressProps.shoulderW} 78 Q ${centerX - progressProps.shoulderW - 5} 85 ${centerX - progressProps.shoulderW + 5} 92 L ${centerX + progressProps.shoulderW - 5} 92 Q ${centerX + progressProps.shoulderW + 5} 85 ${centerX + progressProps.shoulderW} 78 Q ${centerX} 75 ${centerX - progressProps.shoulderW} 78`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Shoulder muscle definition */}
          <Path d={`M ${centerX - progressProps.shoulderW + 8} 85 Q ${centerX - 15} 82 ${centerX - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
          <Path d={`M ${centerX + 8} 85 Q ${centerX + 15} 82 ${centerX + progressProps.shoulderW - 8} 85`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
      
          {/* Chest/torso - more anatomical ribcage shape */}
          <Path
            d={`M ${centerX - progressProps.chestW} 95 Q ${centerX - progressProps.chestW - 2} 110 ${centerX - progressProps.chestW + 3} 135 Q ${centerX} 138 ${centerX + progressProps.chestW - 3} 135 Q ${centerX + progressProps.chestW + 2} 110 ${centerX + progressProps.chestW} 95 Q ${centerX} 92 ${centerX - progressProps.chestW} 95`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Enhanced muscle definition for progress */}
          {!isFemale && viewMode === 'front' && (
            <G opacity={0.6}>
              <Line x1={centerX} y1={95} x2={centerX} y2={125} stroke={Colors.dark.accent} strokeWidth="2" />
              <Line x1={centerX - 12} y1={102} x2={centerX + 12} y2={102} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={centerX - 12} y1={112} x2={centerX + 12} y2={112} stroke={Colors.dark.accent} strokeWidth="1.5" />
              <Line x1={centerX - 12} y1={122} x2={centerX + 12} y2={122} stroke={Colors.dark.accent} strokeWidth="1.5" />
            </G>
          )}
      
          {/* Waist - more realistic torso taper */}
          <Path
            d={`M ${centerX - progressProps.waistW} 140 Q ${centerX - progressProps.waistW - 2} 160 ${centerX - progressProps.waistW + 2} 180 Q ${centerX} 182 ${centerX + progressProps.waistW - 2} 180 Q ${centerX + progressProps.waistW + 2} 160 ${centerX + progressProps.waistW} 140 Q ${centerX} 138 ${centerX - progressProps.waistW} 140`}
            fill="url(#progressGradient)"
            stroke={Colors.dark.accent}
            strokeWidth="1.2"
          />
          
          {/* Enhanced female hips with better curves */}
          {isFemale && (
            <Path
              d={`M ${centerX - progressProps.waistW - 8} 175 Q ${centerX - progressProps.waistW - 12} 185 ${centerX - progressProps.waistW - 6} 195 Q ${centerX} 198 ${centerX + progressProps.waistW + 6} 195 Q ${centerX + progressProps.waistW + 12} 185 ${centerX + progressProps.waistW + 8} 175 Q ${centerX} 172 ${centerX - progressProps.waistW - 8} 175`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
          )}
      
          {/* Arms - more realistic upper arm and forearm structure */}
          <G>
            {/* Left arm - upper arm */}
            <Path
              d={`M ${centerX - progressProps.shoulderW - 5} 95 Q ${centerX - progressProps.shoulderW - 12 - progressProps.armW} 100 ${centerX - progressProps.shoulderW - 10 - progressProps.armW} 130 Q ${centerX - progressProps.shoulderW - 6 - progressProps.armW} 132 ${centerX - progressProps.shoulderW - 2 - progressProps.armW} 130 Q ${centerX - progressProps.shoulderW - progressProps.armW} 100 ${centerX - progressProps.shoulderW - 5} 95`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left forearm */}
            <Path
              d={`M ${centerX - progressProps.shoulderW - 8 - progressProps.armW/2} 132 Q ${centerX - progressProps.shoulderW - 10 - progressProps.armW/2} 135 ${centerX - progressProps.shoulderW - 9 - progressProps.armW/2} 165 Q ${centerX - progressProps.shoulderW - 5 - progressProps.armW/2} 167 ${centerX - progressProps.shoulderW - 3 - progressProps.armW/2} 165 Q ${centerX - progressProps.shoulderW - 4 - progressProps.armW/2} 135 ${centerX - progressProps.shoulderW - 8 - progressProps.armW/2} 132`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left hand */}
            <Ellipse
              cx={centerX - progressProps.shoulderW - 6 - progressProps.armW/2}
              cy={172}
              rx={5}
              ry={8}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
            
            {/* Right arm - upper arm */}
            <Path
              d={`M ${centerX + progressProps.shoulderW + 5} 95 Q ${centerX + progressProps.shoulderW + 12 + progressProps.armW} 100 ${centerX + progressProps.shoulderW + 10 + progressProps.armW} 130 Q ${centerX + progressProps.shoulderW + 6 + progressProps.armW} 132 ${centerX + progressProps.shoulderW + 2 + progressProps.armW} 130 Q ${centerX + progressProps.shoulderW + progressProps.armW} 100 ${centerX + progressProps.shoulderW + 5} 95`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right forearm */}
            <Path
              d={`M ${centerX + progressProps.shoulderW + 8 + progressProps.armW/2} 132 Q ${centerX + progressProps.shoulderW + 10 + progressProps.armW/2} 135 ${centerX + progressProps.shoulderW + 9 + progressProps.armW/2} 165 Q ${centerX + progressProps.shoulderW + 5 + progressProps.armW/2} 167 ${centerX + progressProps.shoulderW + 3 + progressProps.armW/2} 165 Q ${centerX + progressProps.shoulderW + 4 + progressProps.armW/2} 135 ${centerX + progressProps.shoulderW + 8 + progressProps.armW/2} 132`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right hand */}
            <Ellipse
              cx={centerX + progressProps.shoulderW + 6 + progressProps.armW/2}
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
              d={`M ${centerX - 15} 185 Q ${centerX - 18 - progressProps.legW} 190 ${centerX - 16 - progressProps.legW} 240 Q ${centerX - 12 - progressProps.legW} 242 ${centerX - 8 - progressProps.legW} 240 Q ${centerX - 10 - progressProps.legW} 190 ${centerX - 15} 185`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left calf */}
            <Path
              d={`M ${centerX - 14 - progressProps.legW/2} 242 Q ${centerX - 16 - progressProps.legW/2} 245 ${centerX - 14 - progressProps.legW/2} 295 Q ${centerX - 10 - progressProps.legW/2} 297 ${centerX - 6 - progressProps.legW/2} 295 Q ${centerX - 8 - progressProps.legW/2} 245 ${centerX - 14 - progressProps.legW/2} 242`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Left foot */}
            <Ellipse
              cx={centerX - 10 - progressProps.legW/2}
              cy={302}
              rx={12}
              ry={6}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1"
            />
            
            {/* Right thigh */}
            <Path
              d={`M ${centerX + 15} 185 Q ${centerX + 18 + progressProps.legW} 190 ${centerX + 16 + progressProps.legW} 240 Q ${centerX + 12 + progressProps.legW} 242 ${centerX + 8 + progressProps.legW} 240 Q ${centerX + 10 + progressProps.legW} 190 ${centerX + 15} 185`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right calf */}
            <Path
              d={`M ${centerX + 14 + progressProps.legW/2} 242 Q ${centerX + 16 + progressProps.legW/2} 245 ${centerX + 14 + progressProps.legW/2} 295 Q ${centerX + 10 + progressProps.legW/2} 297 ${centerX + 6 + progressProps.legW/2} 295 Q ${centerX + 8 + progressProps.legW/2} 245 ${centerX + 14 + progressProps.legW/2} 242`}
              fill="url(#progressGradient)"
              stroke={Colors.dark.accent}
              strokeWidth="1.2"
            />
            
            {/* Right foot */}
            <Ellipse
              cx={centerX + 10 + progressProps.legW/2}
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
            cx={centerX}
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
        <SvgText x={centerX} y={325} textAnchor="middle" fill={isFemale ? '#FFB6C1' : '#87CEEB'} fontSize="13" fontWeight="bold">
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
        {/* Header with view toggle */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showProgress ? 'Progress Comparison' : (viewMode === 'front' ? 'Front View' : 'Back View')}
          </Text>
          <TouchableOpacity onPress={toggleView} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>
              {viewMode === 'front' ? '🔄 Back' : '🔄 Front'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Main SVG container */}
        <View style={styles.svgWrapper}>
          <TouchableOpacity onPress={toggleView} style={styles.svgContainer}>
            <Svg width="320" height="400" viewBox="0 0 320 400">
              <Defs>
                <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#FFF0F0' : '#F0F8FF'} />
                  <Stop offset="50%" stopColor={isFemale ? '#FFE4E1' : '#E6F3FF'} />
                  <Stop offset="100%" stopColor={isFemale ? '#FFCCCB' : '#B0E0E6'} />
                </LinearGradient>
                <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={isFemale ? '#A0522D' : '#8B4513'} />
                  <Stop offset="50%" stopColor={isFemale ? '#8B4513' : '#654321'} />
                  <Stop offset="100%" stopColor={isFemale ? '#654321' : '#4A2C17'} />
                </LinearGradient>
                <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={Colors.dark.accent} stopOpacity="0.3" />
                  <Stop offset="50%" stopColor={Colors.dark.accent} stopOpacity="0.2" />
                  <Stop offset="100%" stopColor={Colors.dark.accent} stopOpacity="0.1" />
                </LinearGradient>
              </Defs>
              
              {/* Render the human body */}
              {renderHumanBody()}
              
              {/* Render comparison if enabled */}
              {showComparison ? renderComparisonWithDivider() : null}
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
    height: 400, // Larger, visually prominent
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F1419',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelContainer: {
    flex: 1,
    backgroundColor: '#0F1419',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  svgWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
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