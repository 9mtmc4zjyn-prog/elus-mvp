import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type ProfileAvatarProps = {
  name?: string;
  initials?: string;
  photoUrl?: string;
  imageUrl?: string;
  source?: ImageSourcePropType;
  size?: number;
  ringColors?: string[];
  bondColors?: string[];
  colors?: string[];
  verified?: boolean;
  showVerifiedBadge?: boolean;
  showConnectionRing?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function getInitials(name?: string, fallback?: string) {
  if (fallback) return fallback;

  if (!name) return 'EL';

  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return 'EL';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeColors(colors?: string[]) {
  return colors?.filter(Boolean) ?? [];
}

function getRingSides(colors: string[]) {
  if (colors.length === 1) {
    return {
      top: colors[0],
      right: colors[0],
      bottom: colors[0],
      left: colors[0],
    };
  }

  if (colors.length === 2) {
    return {
      top: colors[0],
      right: colors[0],
      bottom: colors[1],
      left: colors[1],
    };
  }

  if (colors.length === 3) {
    return {
      top: colors[0],
      right: colors[1],
      bottom: colors[2],
      left: colors[0],
    };
  }

  return {
    top: colors[0],
    right: colors[1],
    bottom: colors[2],
    left: colors[3],
  };
}

export default function ProfileAvatar({
  name,
  initials,
  photoUrl,
  imageUrl,
  source,
  size = 54,
  ringColors,
  bondColors,
  colors,
  verified = false,
  showVerifiedBadge = false,
  showConnectionRing = false,
  onPress,
  style,
}: ProfileAvatarProps) {
  const activeColors = normalizeColors(ringColors ?? bondColors ?? colors);
  const hasConnectionRing = showConnectionRing && activeColors.length > 0;

  const ringSides = hasConnectionRing
    ? getRingSides(activeColors)
    : {
        top: 'transparent',
        right: 'transparent',
        bottom: 'transparent',
        left: 'transparent',
      };

  const ringWidth = hasConnectionRing
    ? Math.max(4, Math.round(size * 0.075))
    : 0;

  const outerSize = size + (hasConnectionRing ? ringWidth * 2 + 6 : 6);
  const innerSize = size;

  const imageSource =
    source ??
    (photoUrl ? { uri: photoUrl } : imageUrl ? { uri: imageUrl } : undefined);

  const content = (
    <View
      style={[
        styles.container,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: ringWidth,
          borderTopColor: ringSides.top,
          borderRightColor: ringSides.right,
          borderBottomColor: ringSides.bottom,
          borderLeftColor: ringSides.left,
          shadowColor: hasConnectionRing ? activeColors[0] : '#000000',
          shadowOpacity: hasConnectionRing ? 0.28 : 0,
          elevation: hasConnectionRing ? 6 : 0,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize: Math.max(14, Math.round(size * 0.32)),
              },
            ]}
          >
            {getInitials(name, initials)}
          </Text>
        )}
      </View>

      {verified && showVerifiedBadge ? (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },

  inner: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A12',
    borderWidth: 2,
    borderColor: '#05060A',
  },

  initials: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#36D399',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05060A',
  },

  verifiedText: {
    color: '#05060A',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});