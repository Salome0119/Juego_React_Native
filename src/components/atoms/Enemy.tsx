import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export const ENEMY_WIDTH = 48;
export const ENEMY_HEIGHT = 42;
export const ENEMY_ASPECT_RATIO = 250 / 276;
export const BOSS_ASPECT_RATIO = 348 / 312;
export const PIRANHA_ASPECT_RATIO = 254 / 334;

export const getEnemySpriteSize = (
  width: number,
  height: number,
  aspectRatio: number
): { width: number; height: number } => {
  const spriteWidth = Math.min(width, height * aspectRatio);
  return { width: spriteWidth, height: spriteWidth / aspectRatio };
};

interface EnemyProps {
  facing?: 'left' | 'right';
  width?: number;
  height?: number;
  aspectRatio?: number;
  imageSource?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

export const Enemy = React.memo(function Enemy({
  facing = 'right',
  width = ENEMY_WIDTH,
  height = ENEMY_HEIGHT,
  aspectRatio = ENEMY_ASPECT_RATIO,
  imageSource,
  style,
}: EnemyProps) {
  const sprite = getEnemySpriteSize(width, height, aspectRatio);

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
        source={imageSource ?? require('../../../assets/monster-green.png')}
        style={[
          styles.image,
          {
            width: sprite.width,
            height: sprite.height,
            left: (width - sprite.width) / 2,
          },
        ]}
        resizeMode="contain"
        fadeDuration={0}
        accessible
        accessibilityLabel="Monstruo"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  image: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
