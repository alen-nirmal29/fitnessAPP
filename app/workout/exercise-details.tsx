import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Play, Info, Target, Clock, Dumbbell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import BackButton from '@/components/BackButton';

export default function ExerciseDetailsScreen() {
  const params = useLocalSearchParams();
  const dayName = params.dayName as string;
  const exercises = params.exercises ? JSON.parse(params.exercises as string) : [];

  const handleBack = () => {
    router.back();
  };

  const getExerciseInstructions = (exerciseName: string) => {
    const instructions = {
      'Bench Press': {
        setup: 'Lie on a flat bench with your feet planted firmly on the ground',
        execution: 'Lower the bar to your chest, then press it back up to the starting position',
        tips: [
          'Keep your back flat against the bench',
          'Grip the bar slightly wider than shoulder width',
          'Control the descent and explode upward',
          'Keep your core tight throughout the movement'
        ],
        muscles: ['Chest', 'Triceps', 'Shoulders'],
        difficulty: 'Intermediate'
      },
      'Squats': {
        setup: 'Stand with your feet shoulder-width apart, bar resting on your upper back',
        execution: 'Lower your body by bending your knees and hips, then return to standing',
        tips: [
          'Keep your chest up and back straight',
          'Push your knees out in line with your toes',
          'Go as deep as your mobility allows',
          'Drive through your heels to stand up'
        ],
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
        difficulty: 'Beginner'
      },
      'Deadlift': {
        setup: 'Stand with your feet hip-width apart, bar close to your shins',
        execution: 'Hinge at your hips and knees to lower your hands to the bar, then stand up',
        tips: [
          'Keep the bar close to your body throughout',
          'Maintain a neutral spine',
          'Push your hips back as you lower',
          'Drive through your heels to stand'
        ],
        muscles: ['Hamstrings', 'Glutes', 'Lower Back'],
        difficulty: 'Advanced'
      },
      'Pull-ups': {
        setup: 'Grab the pull-up bar with your hands slightly wider than shoulder width',
        execution: 'Pull your body up until your chin is over the bar, then lower back down',
        tips: [
          'Engage your lats and back muscles',
          'Avoid swinging or using momentum',
          'Lower yourself under control',
          'Keep your core tight throughout'
        ],
        muscles: ['Back', 'Biceps', 'Shoulders'],
        difficulty: 'Intermediate'
      },
      'Push-ups': {
        setup: 'Start in a plank position with your hands slightly wider than shoulder width',
        execution: 'Lower your body until your chest nearly touches the ground, then push back up',
        tips: [
          'Keep your body in a straight line',
          'Lower yourself under control',
          'Engage your core throughout',
          'Breathe steadily during the movement'
        ],
        muscles: ['Chest', 'Triceps', 'Shoulders'],
        difficulty: 'Beginner'
      }
    };

    return instructions[exerciseName as keyof typeof instructions] || {
      setup: 'Follow proper form and technique',
      execution: 'Perform the exercise with controlled movements',
      tips: ['Focus on proper form', 'Breathe steadily', 'Engage target muscles'],
      muscles: ['Primary muscle groups'],
      difficulty: 'Beginner'
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} style={styles.backButton} />
        <Text style={styles.title}>{dayName}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Exercise Instructions & Form Tips</Text>
        
        {exercises.map((exercise: any, index: number) => {
          const instructions = getExerciseInstructions(exercise.name);
          
          return (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitleContainer}>
                  <Dumbbell size={20} color={Colors.dark.accent} />
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                </View>
                <View style={styles.exerciseBadge}>
                  <Text style={styles.exerciseBadgeText}>{exercise.sets} × {exercise.reps}</Text>
                </View>
              </View>

              <View style={styles.instructionSection}>
                <View style={styles.instructionHeader}>
                  <Play size={16} color={Colors.dark.accent} />
                  <Text style={styles.instructionTitle}>How to Perform</Text>
                </View>
                
                <View style={styles.instructionStep}>
                  <Text style={styles.stepLabel}>Setup:</Text>
                  <Text style={styles.stepText}>{instructions.setup}</Text>
                </View>
                
                <View style={styles.instructionStep}>
                  <Text style={styles.stepLabel}>Execution:</Text>
                  <Text style={styles.stepText}>{instructions.execution}</Text>
                </View>
              </View>

              <View style={styles.tipsSection}>
                <View style={styles.instructionHeader}>
                  <Info size={16} color={Colors.dark.accent} />
                  <Text style={styles.instructionTitle}>Form Tips</Text>
                </View>
                
                {instructions.tips.map((tip: string, tipIndex: number) => (
                  <View key={tipIndex} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.exerciseInfo}>
                <View style={styles.infoItem}>
                  <Target size={16} color={Colors.dark.subtext} />
                  <Text style={styles.infoText}>{instructions.muscles.join(', ')}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Clock size={16} color={Colors.dark.subtext} />
                  <Text style={styles.infoText}>{exercise.restTime}s rest</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  exerciseCard: {
    marginBottom: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  exerciseBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseBadgeText: {
    color: Colors.dark.gradient.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionSection: {
    marginBottom: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  instructionStep: {
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.accent,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: Colors.dark.accent,
    marginRight: 8,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    flex: 1,
    lineHeight: 20,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginLeft: 4,
  },
}); 