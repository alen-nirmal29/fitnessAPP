import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Colors from '@/constants/colors';

interface CardProps extends TouchableOpacityProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({ title, subtitle, children, style, onPress, ...rest }: CardProps) {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.8}
      {...rest}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  content: {
    flex: 1,
  },
});