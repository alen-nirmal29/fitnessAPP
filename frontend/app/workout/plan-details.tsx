import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Clock, ArrowRight, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import BodyScaler from '@/components/BodyScaler';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import BackButton from '@/components/BackButton';

export default function PlanDetailsScreen() {
  const { currentPlan } = useWorkoutStore();
  const { user } = useAuthStore();

  if (!currentPlan) {
    router.replace('/workout/plan-selection');
    return null;
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  React.useEffect(() => {
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

  const handleStartPlan = () => {
    if (!currentPlan) return;
    
    // Mark the first day as active
    const firstDay = currentPlan.schedule.find(day => !day.restDay);
    if (!firstDay) {
      console.error('No workout days found in the plan');
      return;
    }
    
    // Navigate to the first workout day
    router.push({
      pathname: '/workout/session',
      params: { 
        dayId: firstDay.id,
        dayName: firstDay.name,
        exercises: JSON.stringify(firstDay.exercises)
      }
    });
  };

  const handleBack = () => {
    router.replace('/workout/plan-selection');
  };

  const handleViewDetails = (day: any) => {
    // Navigate to workout details screen with the specific day's exercises
    router.push({
      pathname: '/workout/exercise-details',
      params: { 
        dayId: day.id,
        dayName: day.name,
        exercises: JSON.stringify(day.exercises)
      }
    });
  };

  // Mock goal measurements based on the workout plan
  const getGoalMeasurements = () => {
    const current = user?.currentMeasurements || {
      chest: 50,
      neck: 40,
      waist: 80,
      leftarm: 30,
      rightarm: 30,
      leftthigh: 50,
      rightthigh: 50,
      shoulders: 110,
      hips: 90,
      calves: 35
    };

    if (!current) return null;

    switch (currentPlan.specificGoal) {
      case 'build_muscle':
        return {
          ...current,
          chest: (current.chest || 0) + 5,
          leftarm: (current.leftarm || 0) + 3,
          rightarm: (current.rightarm || 0) + 3,
          leftthigh: (current.leftthigh || 0) + 3,
          rightthigh: (current.rightthigh || 0) + 3,
          shoulders: (current.shoulders || 0) + 5,
        };
      case 'weight_loss':
        return {
          ...current,
          chest: Math.max(0, (current.chest || 0) - 2),
          waist: Math.max(0, (current.waist || 0) - 5),
          hips: Math.max(0, (current.hips || 0) - 3),
        };
      case 'increase_strength':
        return {
          ...current,
          chest: (current.chest || 0) + 3,
          waist: Math.max(0, (current.waist || 0) - 2),
          leftarm: (current.leftarm || 0) + 2,
          rightarm: (current.rightarm || 0) + 2,
          leftthigh: (current.leftthigh || 0) + 2,
          rightthigh: (current.rightthigh || 0) + 2,
          shoulders: (current.shoulders || 0) + 3,
        };
      default:
        return current;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentPlan.name}</Text>
          <Text style={styles.subtitle}>{currentPlan.description}</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Calendar size={16} color={Colors.dark.subtext} />
              <Text style={styles.infoText}>{getDurationText(currentPlan.duration)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Clock size={16} color={Colors.dark.subtext} />
              <Text style={styles.infoText}>
                {currentPlan.schedule.length} {currentPlan.schedule.length === 1 ? 'Day' : 'Days'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.scheduleContainer}>
          <Text style={styles.sectionTitle}>Workout Schedule</Text>
          
          {currentPlan.schedule.map((day, index) => (
            <Card key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.name}</Text>
                {day.restDay && (
                  <View style={styles.restBadge}>
                    <Text style={styles.restText}>Rest Day</Text>
                  </View>
                )}
              </View>
              
              {!day.restDay && (
                <View style={styles.exercisesList}>
                  {day.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseItem}>
                      <CheckCircle size={16} color={Colors.dark.accent} />
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseInfo}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {index < currentPlan.schedule.length - 1 && (
                <TouchableOpacity style={styles.viewMoreButton} onPress={() => handleViewDetails(day)}>
                  <Text style={styles.viewMoreText}>View Details</Text>
                  <ArrowRight size={16} color={Colors.dark.accent} />
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.modelContainer}>
          <Text style={styles.sectionTitle}>Expected Body Transformation</Text>
          <Card style={styles.modelCard}>
            <Text style={styles.modelText}>
              Based on your goals and this workout plan, here's how your body could transform over time.
            </Text>
            <View style={styles.verticalModels}>
              <Text style={styles.modelLabel}>Current</Text>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%', height: 350, marginVertical: 12, alignSelf: 'center' }}>
                <BodyScaler gender={user?.gender === 'female' ? 'female' : 'male'} measurements={user?.currentMeasurements} readOnly={true} />
              </Animated.View>
              <Text style={styles.modelLabel}>Goal</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.footer, {alignItems: 'center'}]}>
        <BackButton
          onPress={handleBack}
          style={{ marginRight: 12 }}
        />
        <Button
          title="Start Plan"
          onPress={handleStartPlan}
          variant="primary"
          size="large"
          style={{ ...styles.button, flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scheduleContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  restBadge: {
    backgroundColor: 'rgba(59, 95, 227, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  exercisesList: {
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseDetails: {
    marginLeft: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  exerciseInfo: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewMoreText: {
    color: Colors.dark.accent,
    marginRight: 4,
    fontWeight: '500',
  },
  modelContainer: {
    marginBottom: 24,
  },
  modelCard: {
    padding: 16,
  },
  modelText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  modelWrapper: {
    width: '100%',
    aspectRatio: 1.3, // Adjust as needed for compact model
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactModel: {
    width: '100%',
    height: '100%',
  },
  verticalModels: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 16,
    width: '100%',
  },
  modelNormal: {
    width: 320,
    height: 400,
    marginVertical: 12,
    alignSelf: 'center',
  },
  modelLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
});