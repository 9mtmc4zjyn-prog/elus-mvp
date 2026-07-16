import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme/ThemeContext';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function IconButton({
  icon, size = 24, color, backgroundColor, onPress,
  disabled = false, style, accessibilityLabel,
}: IconButtonProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: backgroundColor || colors.surfaceElevated, opacity: disabled ? 0.4 : 1 }, style]}
      onPress={onPress} disabled={disabled} activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || `Botão ${icon}`} accessibilityRole="button"
    >
      <Ionicons name={icon} size={size} color={color || colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
