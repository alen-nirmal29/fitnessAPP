import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutPlan } from '@/types/workout';
import Colors from '@/constants/colors';
import { Calendar, Clock } from 'lucide-react-native';

interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
  onPress: () => void;
  isSelected?: boolean;
}

export default function WorkoutPlanCard({
  plan,
  onPress,
  isSelected = false,
}: WorkoutPlanCardProps) {
  const getDurationText = (duration: string) => {
    switch (duration) {
      case '1_month':
        return '1 Month';
      case '3_month':
        return '3 Months';
      case '6_month':
        return '6 Months';
      case '1_year':
        return '1 Year';
      default:
        return duration;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return Colors.dark.success;
      case 'intermediate':
        return Colors.dark.warning;
      case 'advanced':
        return Colors.dark.error;
      default:
        return Colors.dark.accent;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isSelected 
          ? [Colors.dark.gradient.primary, Colors.dark.gradient.secondary]
          : [Colors.dark.card, Colors.dark.card]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{plan.name}</Text>
          <View style={[
            styles.difficultyBadge, 
            { backgroundColor: getDifficultyColor(plan.difficulty) }
          ]}>
            <Text style={styles.difficultyText}>
              {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.description}>{plan.description}</Text>
        
        <View style={styles.footer}>
          <View style={styles.infoItem}>
            <Calendar size={16} color={Colors.dark.subtext} />
            <Text style={styles.infoText}>{getDurationText(plan.duration)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Clock size={16} color={Colors.dark.subtext} />
            <Text style={styles.infoText}>
              {plan.schedule.length} {plan.schedule.length === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
          
          {plan.isAIGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiText}>AI Generated</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  selected: {
    borderColor: Colors.dark.accent,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginLeft: 4,
  },
  aiBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});