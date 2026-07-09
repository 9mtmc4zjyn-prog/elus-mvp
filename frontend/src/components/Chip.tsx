import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type ChipSize = 'small' | 'large';

interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  size?: ChipSize;
}

export function Chip({ label, selected = false, disabled = false, size = 'small', ...pressableProps }: ChipProps) {
  const { colors } = useTheme();
  const isLarge = size === 'large';

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        isLarge ? styles.baseLarge : styles.baseSmall,
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
          isLarge ? styles.textLarge : styles.textSmall,
          { color: disabled ? colors.disabledText : selected ? colors.accent : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseSmall: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLarge: {
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  textLarge: {
    fontSize: 17,
    fontWeight: '900',
  },
});
