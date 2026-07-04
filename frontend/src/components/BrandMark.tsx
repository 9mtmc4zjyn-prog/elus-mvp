import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type BrandMarkProps = {
  size?: 'small' | 'medium' | 'large';
  variant?: 'symbol' | 'horizontal' | 'full';
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function BrandMark({
  size = 'medium',
  variant = 'horizontal',
  showTagline = false,
  style,
}: BrandMarkProps) {
  const symbolSize =
    size === 'small' ? 36 : size === 'medium' ? 56 : 88;

  const textSize =
    size === 'small' ? 22 : size === 'medium' ? 32 : 44;

  if (variant === 'symbol') {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../../assets/brand/elus_symbol_main_transparent.png')}
          style={{ width: symbolSize, height: symbolSize }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <Image
        source={require('../../assets/brand/elus_symbol_main_transparent.png')}
        style={{
          width: symbolSize,
          height: symbolSize,
          marginRight: 14,
        }}
        resizeMode="contain"
      />

      <View style={styles.textCol}>
        <Text
          style={[
            styles.brand,
            {
              fontSize: textSize,
              letterSpacing: textSize * 0.18,
            },
          ]}
        >
          ELUS
        </Text>

        {showTagline && (
          <Text style={styles.tagline}>Conexões que importam.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  textCol: {
    justifyContent: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});