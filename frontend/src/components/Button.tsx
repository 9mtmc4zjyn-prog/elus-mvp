import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, variant = 'primary', loading = false, disabled = false, ...pressableProps }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantBackground =
    variant === 'primary' ? colors.accent :
    variant === 'destructive' ? colors.danger :
    'transparent';

  const variantBorder = variant === 'secondary' ? colors.borderStrong : 'transparent';
  const variantShadowColor = variant === 'secondary' ? 'transparent' : variantBackground;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isDisabled ? colors.disabledBackground : variantBackground,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: variantBorder,
          shadowColor: isDisabled ? 'transparent' : variantShadowColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={isDisabled ? colors.disabledText : colors.text} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: isDisabled ? colors.disabledText : colors.text },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
});
