import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export function Chip({ label, selected = false, disabled = false, ...pressableProps }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled
            ? colors.disabledBackground
            : selected ? colors.chipHighlightBackground : colors.surfaceSoft,
          borderColor: disabled
            ? colors.disabledBackground
            : selected ? colors.chipHighlightBorder : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      {...pressableProps}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? colors.disabledText : selected ? colors.accent : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
});
