import React, { useEffect, useRef } from 'react';
import { Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SCREEN_HEIGHT } from '../../constants/theme';

export const CHASE_MONSTER_WIDTH = 260;
export const CHASE_MONSTER_HEIGHT = 240;
export const CHASE_MONSTER_FRAME_MS = 180;

const SPRITES = [
  require('../../../assets/mosntruo1level2.png'),
  require('../../../assets/mosntruo2level2.png'),
  require('../../../assets/mosntruo3level2.png'),
  require('../../../assets/mosntruo4level2.png'),
];

export type ChaseMonsterPhase = 'drop' | 'chase' | 'defeated';

interface ChaseMonsterProps {
  left: number;
  bottom: number;
  facing: 'left' | 'right';
  phase: ChaseMonsterPhase;
  hitFlash: boolean;
  style?: StyleProp<ViewStyle>;
}

const MonsterFrame = React.memo(function MonsterFrame({
  source,
  index,
  frame,
}: {
  source: number;
  index: number;
  frame: ReturnType<typeof useSharedValue<number>>;
}) {
  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: Math.round(frame.value) % SPRITES.length === index ? 1 : 0 }),
    [frame, index]
  );

  return (
    <Animated.Image
      source={source}
      style={[styles.sprite, animatedStyle]}
      resizeMode="contain"
      fadeDuration={0}
      accessible={false}
    />
  );
});

export const ChaseMonster = React.memo(function ChaseMonster({
  left,
  bottom,
  facing,
  phase,
  hitFlash,
  style,
}: ChaseMonsterProps) {
  const frame = useSharedValue(0);
  const visualX = useSharedValue(left);
  const visualBottom = useSharedValue(
    phase === 'drop' ? SCREEN_HEIGHT + 220 : bottom
  );
  const flash = useSharedValue(0);
  const defeated = useSharedValue(0);
  const dropStarted = useRef(false);

  useEffect(() => {
    if (phase === 'defeated') {
      cancelAnimation(frame);
      return;
    }

    frame.value = withRepeat(
      withTiming(SPRITES.length - 1, {
        duration: CHASE_MONSTER_FRAME_MS * (SPRITES.length - 1),
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(frame);
    };
  }, [frame, phase]);

  useEffect(() => {
    if (phase === 'drop' && !dropStarted.current) {
      dropStarted.current = true;
      visualBottom.value = SCREEN_HEIGHT + 220;
      visualBottom.value = withTiming(bottom, {
        duration: 900,
        easing: Easing.in(Easing.quad),
      });
    } else if (phase === 'chase') {
      cancelAnimation(visualBottom);
      visualBottom.value = Math.max(bottom, 0);
    }
  }, [bottom, phase, visualBottom]);

  useEffect(() => {
    if (phase === 'chase') {
      cancelAnimation(visualX);
      visualX.value = left;
      return;
    }
    visualX.value = withTiming(left, {
      duration: 80,
      easing: Easing.linear,
    });
  }, [left, phase, visualX]);

  useEffect(() => {
    if (!hitFlash) {
      return;
    }
    flash.value = 1;
    flash.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
  }, [hitFlash, flash]);

  useEffect(() => {
    if (phase === 'defeated') {
      defeated.value = withTiming(1, { duration: 450, easing: Easing.in(Easing.quad) });
    }
  }, [defeated, phase]);

  const rootStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: visualX.value },
        { translateY: -visualBottom.value },
        { scaleX: facing === 'left' ? -1 : 1 },
        { scale: 1 - defeated.value * 0.45 },
      ],
      opacity: 1 - defeated.value,
    }),
    [facing]
  );

  const flashStyle = useAnimatedStyle(
    () => ({ opacity: 1 - flash.value * 0.6 }),
    []
  );

  const tintStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.4 }), []);

  return (
    <Animated.View pointerEvents="none" style={[styles.root, rootStyle, style]}>
      <Animated.View style={[styles.layer, flashStyle]}>
        {SPRITES.map((source, index) => (
          <MonsterFrame key={index} source={source} index={index} frame={frame} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.tint, tintStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: CHASE_MONSTER_WIDTH,
    height: CHASE_MONSTER_HEIGHT,
    zIndex: 5,
    elevation: 8,
  },
  layer: {
    position: 'absolute',
    inset: 0,
  },
  sprite: {
    position: 'absolute',
    inset: 0,
    width: CHASE_MONSTER_WIDTH,
    height: CHASE_MONSTER_HEIGHT,
    backgroundColor: 'transparent',
  },
  tint: {
    position: 'absolute',
    left: CHASE_MONSTER_WIDTH * 0.2,
    right: CHASE_MONSTER_WIDTH * 0.2,
    top: CHASE_MONSTER_HEIGHT * 0.15,
    bottom: CHASE_MONSTER_HEIGHT * 0.1,
    borderRadius: 24,
    backgroundColor: '#ff4d4d',
  },
});
