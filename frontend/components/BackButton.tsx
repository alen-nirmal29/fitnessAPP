import React from 'react';
import Button from './Button';
import { ViewStyle } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function BackButton({ onPress, disabled, style }: BackButtonProps) {
  return (
    <Button
      title="Back"
      onPress={onPress}
      variant="outline"
      size="small"
      disabled={disabled}
      style={[{ width: 130, height: 48, minWidth: 0, minHeight: 0, paddingHorizontal: 18, paddingVertical: 10 }, style]}
    />
  );
} 