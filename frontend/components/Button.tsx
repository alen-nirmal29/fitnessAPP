import React from 'react';
import { 
  TouchableOpacity, 
  View,
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large' | 'square';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'text':
        return styles.textButtonText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'medium':
        return styles.mediumButton;
      case 'large':
        return styles.largeButton;
      case 'square':
        return styles.squareButton;
      default:
        return styles.mediumButton;
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'medium':
        return styles.mediumText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={variant === 'outline' || variant === 'text' ? Colors.dark.accent : '#fff'} />;
    }

    return (
      <>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <Text style={[getTextStyle(), getTextSizeStyle(), textStyle]}>{title}</Text>
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </>
    );
  };

  if (variant === 'primary') {
    const sizeStyle = getSizeStyle();
    const gradientStyle = {
      ...styles.gradient,
      borderRadius: sizeStyle.borderRadius || 16,
    };
    
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[styles.button, sizeStyle, getButtonStyle(), disabled && styles.disabledButton, style]}
        activeOpacity={0.85}
        {...rest}
      >
        <LinearGradient
          colors={[Colors.dark.gradient.primary, Colors.dark.gradient.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientStyle}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[styles.button, getSizeStyle(), getButtonStyle(), disabled && styles.disabledButton, style]}
      activeOpacity={0.85}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    borderRadius: 16,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  smallButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
    minWidth: 80,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    minWidth: 120,
    borderRadius: 16,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
    minWidth: 160,
    borderRadius: 16,
  },
  squareButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    minWidth: 56,
    borderRadius: 16,
    aspectRatio: 1,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  textButtonText: {
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 13,
  },
  mediumText: {
    fontSize: 15,
  },
  largeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});