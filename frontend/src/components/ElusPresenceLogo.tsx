import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type ElusPresenceLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function ElusPresenceLogo({
  size = 54,
  style,
}: ElusPresenceLogoProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/brand/elus_symbol_main_transparent.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});