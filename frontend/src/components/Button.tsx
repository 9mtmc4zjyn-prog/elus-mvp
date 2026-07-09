import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success' | 'destructiveSecondary' | 'purpleAccent' | 'mintAccent' | 'warningAccent';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  pressedScale?: number;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  iconSize = 20,
  pressedScale,
  containerStyle,
  textStyle,
  ...pressableProps
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantBackground =
    variant === 'primary' ? colors.accent :
    variant === 'destructive' ? colors.danger :
    variant === 'success' ? colors.success :
    variant === 'destructiveSecondary' ? colors.dangerSoft :
    variant === 'purpleAccent' ? colors.purple :
    variant === 'mintAccent' ? colors.mint :
    variant === 'warningAccent' ? colors.warning :
    'transparent';

  const variantBorder =
    variant === 'secondary' ? colors.borderStrong :
    variant === 'destructiveSecondary' ? colors.danger :
    'transparent';
  const variantShadowColor = (variant === 'secondary' || variant === 'destructiveSecondary') ? 'transparent' : variantBackground;
  const textColor = isDisabled
    ? colors.disabledText
    : variant === 'destructiveSecondary' ? colors.danger
    : variant === 'mintAccent' ? '#061019'
    : variant === 'warningAccent' ? '#1A1200'
    : colors.text;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isDisabled ? colors.disabledBackground : variantBackground,
          borderWidth: (variant === 'secondary' || variant === 'destructiveSecondary') ? 1 : 0,
          borderColor: variantBorder,
          shadowColor: isDisabled ? 'transparent' : variantShadowColor,
          opacity: pressed ? 0.85 : 1,
          transform: pressed && pressedScale ? [{ scale: pressedScale }] : [{ scale: 1 }],
        },
        containerStyle,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconLeft} />
          ) : null}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconRight} />
          ) : null}
        </>
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
    flexDirection: 'row',
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
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
