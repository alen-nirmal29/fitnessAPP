import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface GoalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  onPress: () => void;
}

export default function GoalCard({
  title,
  description,
  icon,
  isSelected = false,
  onPress,
}: GoalCardProps) {
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
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 8,
    height: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  selected: {
    borderColor: Colors.dark.accent,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
});