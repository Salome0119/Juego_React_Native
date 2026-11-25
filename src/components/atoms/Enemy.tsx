import React, { useEffect } from 'react';
import {
  Easing,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
        source={imageSource ?? require('../../../assets/monstruos/monster-green.png')}
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

const BOSS_SPRITES = [
  require('../../../assets/monstruos/monster-green.png'),
  require('../../../assets/monstruos/monster-green2.png'),
  require('../../../assets/monstruos/monster-green3.png'),
  require('../../../assets/monstruos/monster-green4.png'),
];
const BOSS_ANGRY_SPRITE = require('../../../assets/monstruos/monster-green_enojado.png');
const BOSS_FRAME_BASE_MS = 170;
const BOSS_REFERENCE_SPEED = 120;

interface BossEnemySpriteProps {
  facing: 'left' | 'right';
  width: number;
  height: number;
  aspectRatio?: number;
  speed: number;
  moving: boolean;
  hitFlash?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BossFrame = React.memo(function BossFrame({
  source,
  index,
  frame,
  flash,
  left,
  spriteWidth,
  spriteHeight,
}: {
  source: number;
  index: number;
  frame: ReturnType<typeof useSharedValue<number>>;
  flash: ReturnType<typeof useSharedValue<number>>;
  left: number;
  spriteWidth: number;
  spriteHeight: number;
}) {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity:
        (Math.round(frame.value) % BOSS_SPRITES.length === index ? 1 : 0) *
        (1 - flash.value),
    }),
    [frame, flash, index]
  );

  return (
    <Animated.Image
      source={source}
      style={[
        styles.image,
        { left, width: spriteWidth, height: spriteHeight },
        animatedStyle,
      ]}
      resizeMode="contain"
      fadeDuration={0}
      accessible={false}
    />
  );
});

export const BossEnemySprite = React.memo(function BossEnemySprite({
  facing,
  width,
  height,
  aspectRatio = BOSS_ASPECT_RATIO,
  speed,
  moving,
  hitFlash = false,
  style,
}: BossEnemySpriteProps) {
  const frame = useSharedValue(1);
  const bounce = useSharedValue(0);
  const breath = useSharedValue(0);
  const flash = useSharedValue(0);
  const facingScale = useSharedValue(facing === 'left' ? -1 : 1);
  const sprite = getEnemySpriteSize(width, height, aspectRatio);
  const spriteLeft = (width - sprite.width) / 2;

  useEffect(() => {
    if (!moving) {
      cancelAnimation(frame);
      cancelAnimation(bounce);
      frame.value = 1;
      bounce.value = 0;
      return;
    }

    const frameMs = Math.max(
      80,
      Math.min(
        230,
        (BOSS_FRAME_BASE_MS * BOSS_REFERENCE_SPEED) / Math.max(speed, 1)
      )
    );
    frame.value = withRepeat(
      withTiming(BOSS_SPRITES.length - 1, {
        duration: frameMs * (BOSS_SPRITES.length - 1),
        easing: Easing.linear,
      }),
      -1,
      false
    );
    bounce.value = withRepeat(
      withTiming(1, { duration: frameMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(frame);
      cancelAnimation(bounce);
    };
  }, [frame, bounce, moving, speed]);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, {
        duration: moving ? 1300 : 950,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    return () => cancelAnimation(breath);
  }, [breath, moving]);

  useEffect(() => {
    facingScale.value = withTiming(facing === 'left' ? -1 : 1, {
      duration: 120,
      easing: Easing.linear,
    });
  }, [facing, facingScale]);

  useEffect(() => {
    flash.value = withTiming(hitFlash ? 1 : 0, {
      duration: 90,
      easing: Easing.linear,
    });
  }, [flash, hitFlash]);

  const angryStyle = useAnimatedStyle(() => ({ opacity: flash.value }), [flash]);

  const rootStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateY: moving ? -Math.sin(bounce.value * Math.PI) * 4 : -breath.value * 2 },
        { scaleX: facingScale.value },
        { scaleY: moving ? 1 : 1 + breath.value * 0.025 },
      ],
    }),
    [moving]
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { width, height }, rootStyle, style]}
    >
      {BOSS_SPRITES.map((source, index) => (
        <BossFrame
          key={index}
          source={source}
          index={index}
          frame={frame}
          flash={flash}
          left={spriteLeft}
          spriteWidth={sprite.width}
          spriteHeight={sprite.height}
        />
      ))}
      <Animated.Image
        source={BOSS_ANGRY_SPRITE}
        style={[
          styles.image,
          {
            left: spriteLeft,
            width: sprite.width,
            height: sprite.height,
          },
          angryStyle,
        ]}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
    </Animated.View>
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
