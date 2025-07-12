import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useWorkoutSessionStore } from '@/store/workout-session-store';
import { useWorkoutStore } from '@/store/workout-store';

export default function WorkoutsScreen() {
  const { getTodayWorkouts } = useWorkoutSessionStore();
  const { currentPlan } = useWorkoutStore();
  
  // Get current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatWeekRange = () => {
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    return `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}, ${currentDate.getFullYear()}`;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleStartWorkout = () => {
    router.push('/workout/session');
  };

  // Generate week days based on current date
  const getWeekDays = () => {
    const weekDays = [];
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const todayWorkouts = getTodayWorkouts();
  
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const getUpcomingWorkouts = () => {
    const upcoming = [];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    // Mock upcoming workouts based on current plan or defaults
    if (currentPlan && currentPlan.schedule.length > 1) {
      const nextWorkout = currentPlan.schedule[1] || currentPlan.schedule[0];
      upcoming.push({
        date: tomorrow,
        workout: {
          ...nextWorkout,
          description: nextWorkout.description || 'Complete your scheduled workout routine'
        },
        time: '10:00 AM'
      });
    } else {
      upcoming.push({
        date: tomorrow,
        workout: {
          id: 'upcoming-1',
          name: 'Lower Body Strength',
          description: 'Focus on legs and glutes with compound movements',
          exercises: [],
          restDay: false
        },
        time: '10:00 AM'
      });
    }
    
    upcoming.push({
      date: dayAfterTomorrow,
      workout: {
        id: 'rest-day',
        name: 'Rest Day',
        description: 'Take a day off to recover and let your muscles rebuild',
        exercises: [],
        restDay: true
      },
      time: 'All Day'
    });
    
    return upcoming;
  };

  const upcomingWorkouts = getUpcomingWorkouts();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Schedule</Text>
        <Text style={styles.subtitle}>Your weekly workout plan</Text>
      </View>

      <View style={styles.calendarHeader}>
        <Button
          title=""
          onPress={handlePreviousWeek}
          variant="outline"
          size="small"
          style={styles.calendarButton}
          leftIcon={<ChevronLeft size={20} color={Colors.dark.accent} />}
        />
        
        <View style={styles.calendarTitleContainer}>
          <CalendarIcon size={20} color={Colors.dark.text} />
          <Text style={styles.calendarTitle}>{formatWeekRange()}</Text>
        </View>
        
        <Button
          title=""
          onPress={handleNextWeek}
          variant="outline"
          size="small"
          style={styles.calendarButton}
          leftIcon={<ChevronRight size={20} color={Colors.dark.accent} />}
        />
      </View>

      <View style={styles.daysContainer}>
        {weekDays.map((date, index) => (
          <View 
            key={date.toISOString()} 
            style={[
              styles.dayItem, 
              isToday(date) && styles.activeDayItem
            ]}
          >
            <Text style={[styles.dayText, isToday(date) && styles.activeDayText]}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dateText, isToday(date) && styles.activeDateText]}>
              {date.getDate()}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Today's Workouts</Text>

      {todayWorkouts.length > 0 ? (
        todayWorkouts.map((workout) => (
          <Card key={workout.id} style={styles.completedWorkoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTitleContainer}>
                <Dumbbell size={20} color={Colors.dark.success} />
                <Text style={styles.workoutTitle}>{workout.workoutName}</Text>
              </View>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>
            
            <View style={styles.workoutDetails}>
              <Text style={styles.workoutTime}>
                {new Date(workout.date).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </Text>
              <Text style={styles.workoutDescription}>
                {workout.duration} minutes • {workout.exercisesCompleted} exercises • {workout.caloriesBurned} calories
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleContainer}>
              <Dumbbell size={20} color={Colors.dark.accent} />
              <Text style={styles.workoutTitle}>Upper Body Strength</Text>
            </View>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>45 min</Text>
            </View>
          </View>
          
          <View style={styles.workoutDetails}>
            <Text style={styles.workoutTime}>Scheduled for today</Text>
            <Text style={styles.workoutDescription}>
              Focus on chest, shoulders, and triceps with compound movements
            </Text>
          </View>
          
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            variant="primary"
            style={styles.startButton}
          />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Upcoming Workouts</Text>

      {upcomingWorkouts.map((item, index) => (
        <Card key={index} style={styles.upcomingCard}>
          <View style={styles.upcomingHeader}>
            <Text style={styles.upcomingDay}>
              {item.date.toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
            <Text style={styles.upcomingDate}>
              {formatDate(item.date)}
            </Text>
          </View>
          
          <View style={styles.upcomingWorkout}>
            <View style={styles.upcomingWorkoutHeader}>
              <Text style={styles.upcomingWorkoutTitle}>{item.workout.name}</Text>
              <Text style={styles.upcomingWorkoutTime}>{item.time}</Text>
            </View>
            <Text style={styles.upcomingWorkoutDescription}>
              {item.workout.description || 'Complete your scheduled workout routine'}
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarButton: {
    width: 40,
    height: 40,
    padding: 0,
  },
  calendarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  activeDayItem: {
    backgroundColor: Colors.dark.accent,
  },
  dayText: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginBottom: 4,
  },
  activeDayText: {
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  activeDateText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  workoutCard: {
    marginBottom: 16,
  },
  completedWorkoutCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.success,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  workoutBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: Colors.dark.gradient.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: Colors.dark.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutDetails: {
    marginBottom: 16,
  },
  workoutTime: {
    fontSize: 14,
    color: Colors.dark.accent,
    marginBottom: 4,
    fontWeight: '500',
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  startButton: {
    marginTop: 8,
  },
  upcomingCard: {
    marginBottom: 16,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  upcomingDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  upcomingDate: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  upcomingWorkout: {
    marginBottom: 8,
  },
  upcomingWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingWorkoutTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  upcomingWorkoutTime: {
    fontSize: 14,
    color: Colors.dark.accent,
  },
  upcomingWorkoutDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
});