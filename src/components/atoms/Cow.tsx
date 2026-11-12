import React, { useEffect, useState } from 'react';
import { Animated, Image, ImageSourcePropType, StyleProp, StyleSheet, ViewStyle } from 'react-native';

export const COW_WIDTH = 77;
export const COW_HEIGHT = 66;

/**
 * Arma equipada: se dibuja encima del sprite de la vaquita, dentro del mismo
 * contenedor animado, para que herede el volteo (facing) y el rebobinado.
 * `left`/`top` están en dp medidos desde la esquina superior izquierda de la caja.
 */
export interface CowWeapon {
  source: ImageSourcePropType;
  width: number;
  height: number;
  left: number;
  top: number;
}

interface CowProps {
  facing?: 'left' | 'right';
  width?: number;
  height?: number;
  isMoving?: boolean;
  isJumping?: boolean;
  rotation?: number;
  spriteSource?: ImageSourcePropType;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  weapon?: CowWeapon | null;
  style?: StyleProp<ViewStyle>;
}

export const Cow: React.FC<CowProps> = ({
  facing = 'right',
  width = COW_WIDTH,
  height = COW_HEIGHT,
  isMoving = false,
  isJumping = false,
  rotation = 0,
  spriteSource = require('../../../assets/caminando1.png'),
  resizeMode = 'contain',
  weapon = null,
  style,
}) => {
  const [bounce] = useState(() => new Animated.Value(0));
  const [tilt] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: isMoving ? -3 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounce, isMoving]);

  useEffect(() => {
    Animated.timing(tilt, {
      toValue: isJumping ? -10 : 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [isJumping, tilt]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          width,
          height,
          transform: [
            { translateY: bounce },
            { rotate: tilt.interpolate({
                inputRange: [-10, 0],
                outputRange: [`${rotation - 10}deg`, `${rotation}deg`],
              }) },
            { scaleX: facing === 'left' ? -1 : 1 },
          ],
        },
        style,
      ]}
    >
      <Image
        source={spriteSource}
        style={[styles.image, { width, height }]}
        resizeMode={resizeMode}
        fadeDuration={0}
        accessible
        accessibilityLabel="Vaquita"
      />
      {weapon ? (
        <Image
          source={weapon.source}
          style={[
            styles.weapon,
            {
              width: weapon.width,
              height: weapon.height,
              left: weapon.left,
              top: weapon.top,
            },
          ]}
          resizeMode="contain"
          fadeDuration={0}
          accessible={false}
        />
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
  weapon: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
