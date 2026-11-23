import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export const BAT_WIDTH = 110;
export const BAT_HEIGHT = 58;
export const BAT_ASPECT_RATIO = 583 / 307;
export const BAT_HITBOX_WIDTH = 88;
export const BAT_HITBOX_HEIGHT = 56;

interface BatEnemyProps {
  awake: boolean;
  facing?: 'left' | 'right';
  now?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const BatEnemy = React.memo(function BatEnemy({
  awake,
  facing = 'left',
  now = 0,
  width = BAT_WIDTH,
  height = BAT_HEIGHT,
  style,
}: BatEnemyProps) {
  const frame = awake ? Math.floor(now * 9) % 2 : 0;
  const spriteWidth = Math.min(width, height * BAT_ASPECT_RATIO);
  const spriteHeight = spriteWidth / BAT_ASPECT_RATIO;
  const spriteStyle = {
    width: spriteWidth,
    height: spriteHeight,
    top: (height - spriteHeight) / 2,
    shadowColor: '#0b0616',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 7,
  };

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          width,
          height,
          transform: [{ scaleX: facing === 'left' ? -1 : 1 }],
        },
        style,
      ]}
    >
      <Image
        source={require('../../../assets/murcielago1.png')}
        style={[
          styles.image,
          spriteStyle,
          { opacity: frame === 0 ? (awake ? 1 : 0.5) : 0 },
        ]}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
      <Image
        source={require('../../../assets/murcielago2.png')}
        style={[
          styles.image,
          spriteStyle,
          { opacity: frame === 1 ? 1 : 0 },
        ]}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
