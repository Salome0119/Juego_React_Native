import React, { useEffect, useState } from 'react';
import {
  Animated,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { CowWeapon } from './Cow';

const CANVAS_WIDTH = 1376;
const CANVAS_HEIGHT = 768;
const BOX_WIDTH = 140;
const BOX_HEIGHT = 110;
const VISIBLE_WIDTH = 116;
const VISIBLE_HEIGHT = 92;

interface MermaidFrame {
  source: ImageSourcePropType;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const SWIM_FRAMES: MermaidFrame[] = [
  {
    source: require('../../../assets/vaquita/nadando1.png'),
    left: 344,
    right: 968,
    top: 256,
    bottom: 536,
  },
  {
    source: require('../../../assets/vaquita/nadando2.png'),
    left: 348,
    right: 1028,
    top: 228,
    bottom: 572,
  },
  {
    source: require('../../../assets/vaquita/nadando3.png'),
    left: 412,
    right: 1004,
    top: 116,
    bottom: 468,
  },
];

const FLOAT_FRAME: MermaidFrame = {
  source: require('../../../assets/vaquita/nadando4.png'),
  left: 524,
  right: 944,
  top: 252,
  bottom: 660,
};

const ATTACK_FRAME: MermaidFrame = {
  source: require('../../../assets/vaquita/sirena_ataque.png'),
  left: 440,
  right: 936,
  top: 192,
  bottom: 572,
};

const ATTACK_UPGRADED_FRAME: MermaidFrame = {
  source: require('../../../assets/vaquita/sirena_ataque2.0.png'),
  left: 440,
  right: 936,
  top: 192,
  bottom: 572,
};

const frameStyle = (frame: MermaidFrame) => {
  const contentWidth = frame.right - frame.left;
  const contentHeight = frame.bottom - frame.top;
  const scale = Math.min(
    VISIBLE_WIDTH / contentWidth,
    VISIBLE_HEIGHT / contentHeight
  );
  const drawnWidth = contentWidth * scale;
  const drawnHeight = contentHeight * scale;
  return {
    position: 'absolute' as const,
    left: (BOX_WIDTH - drawnWidth) / 2 - frame.left * scale,
    bottom:
      (BOX_HEIGHT - drawnHeight) / 2 -
      (CANVAS_HEIGHT - frame.bottom) * scale,
    width: CANVAS_WIDTH * scale,
    height: CANVAS_HEIGHT * scale,
  };
};

export interface MermaidCowProps {
  facing: 'left' | 'right';
  isMoving: boolean;
  isShooting: boolean;
  upgradedWeapon: boolean;
  weapon?: CowWeapon | null;
  diving: boolean;
  now: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export const MermaidCow: React.FC<MermaidCowProps> = ({
  facing,
  isMoving,
  isShooting,
  upgradedWeapon,
  weapon = null,
  diving,
  now,
  opacity = 1,
  style,
}) => {
  const [rotation] = useState(() => new Animated.Value(0));
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: diving ? (facing === 'left' ? -24 : 24) : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [diving, facing, rotation]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 2.5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: -2.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bob]);

  const frame = isShooting
    ? upgradedWeapon
      ? ATTACK_UPGRADED_FRAME
      : ATTACK_FRAME
    : isMoving
      ? SWIM_FRAMES[Math.floor(now * 6) % SWIM_FRAMES.length]
      : FLOAT_FRAME;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [
            { translateY: bob },
            {
              rotate: rotation.interpolate({
                inputRange: [-30, 30],
                outputRange: ['-30deg', '30deg'],
              }),
            },
            { scaleX: facing === 'left' ? -1 : 1 },
          ],
        },
      ]}
    >
      <Animated.Image
        source={frame.source}
        style={frameStyle(frame)}
        resizeMode="stretch"
        fadeDuration={0}
        accessible
        accessibilityLabel="Vaquita sirena"
      />
      {weapon && (
        <Animated.Image
          source={weapon.source}
          style={[
            styles.weapon,
            {
              left: weapon.left,
              top: weapon.top,
              width: weapon.width,
              height: weapon.height,
            },
          ]}
          resizeMode="contain"
          fadeDuration={0}
          accessible={false}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    backgroundColor: 'transparent',
  },
  weapon: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
