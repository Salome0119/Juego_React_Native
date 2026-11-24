import React, { useCallback, useEffect, useRef } from 'react';
import { Easing, Image, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const IMG_MUD_TRANSFORM = require('../../../assets/trampas/arena1.png');
const IMG_MUD_EDGE = require('../../../assets/trampas/arena2.png');
const IMG_MUD_CENTER = require('../../../assets/trampas/arena3.png');
const IMG_LOG = require('../../../assets/trampas/arena4.png');

const TRANSFORM_TEXTURE = { width: 574, height: 180, topRow: 48 };
const EDGE_TEXTURE = { width: 289, height: 317, surfaceRow: 193 };
const CENTER_TEXTURE = { width: 283, height: 238, surfaceRow: 111 };
const LOG_TEXTURE = { width: 699, height: 357, topRow: 58, bottomRow: 344 };

export const MUD_TRAP_HEIGHT = 100;
export const MUD_TRAP_EDGE_WIDTH = 120;
export const MUD_TRAP_LOG_WIDTH = 230;
export const MUD_TRAP_LOG_HEIGHT = Math.round(
  (MUD_TRAP_LOG_WIDTH * LOG_TEXTURE.height) / LOG_TEXTURE.width
);
export const MUD_TRAP_SINK_DURATION = 3000;

const TRANSFORM_FADE_IN_MS = 700;
const LOOP_CROSSFADE_MS = 500;
const MUD_DRIFT_DURATION_MS = 1600;
const MUD_PULSE_OPACITY = 0.35;

export const getMudLogLeft = (trapLeft: number, trapWidth: number): number =>
  trapLeft + (trapWidth - MUD_TRAP_LOG_WIDTH) / 2;

export const getMudLogBottom = (surfaceY: number): number =>
  surfaceY -
  (LOG_TEXTURE.height - LOG_TEXTURE.bottomRow) *
    (MUD_TRAP_LOG_HEIGHT / LOG_TEXTURE.height);

export const getMudLogTop = (surfaceY: number): number =>
  getMudLogBottom(surfaceY) +
  MUD_TRAP_LOG_HEIGHT -
  LOG_TEXTURE.topRow * (MUD_TRAP_LOG_HEIGHT / LOG_TEXTURE.height);

export interface MudTrapZoneProps {
  width: number;
  left?: number;
  bottom?: number;
  height?: number;
  isTriggered: boolean;
  onSinkComplete: () => void;
  sinkDistance?: number;
  sinkDuration?: number;
}

export const MudTrapZone: React.FC<MudTrapZoneProps> = ({
  width,
  left = 0,
  bottom = 0,
  height = MUD_TRAP_HEIGHT,
  isTriggered,
  onSinkComplete,
  sinkDistance = height,
  sinkDuration = MUD_TRAP_SINK_DURATION,
}) => {
  const sinkProgress = useSharedValue(0);
  const transformOpacity = useSharedValue(0);
  const loopOpacity = useSharedValue(0);
  const drift = useSharedValue(0);
  const agitation = useSharedValue(0);
  const onSinkCompleteRef = useRef(onSinkComplete);

  useEffect(() => {
    onSinkCompleteRef.current = onSinkComplete;
  }, [onSinkComplete]);

  const notifySinkComplete = useCallback(() => {
    onSinkCompleteRef.current();
  }, []);

  useEffect(() => {
    transformOpacity.value = withTiming(
      1,
      { duration: TRANSFORM_FADE_IN_MS, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (!finished) {
          return;
        }

        loopOpacity.value = withTiming(1, {
          duration: LOOP_CROSSFADE_MS,
          easing: Easing.inOut(Easing.quad),
        });
        transformOpacity.value = withTiming(0, {
          duration: LOOP_CROSSFADE_MS,
          easing: Easing.in(Easing.quad),
        });
      }
    );

    return () => {
      cancelAnimation(transformOpacity);
      cancelAnimation(loopOpacity);
    };
  }, [transformOpacity, loopOpacity]);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: MUD_DRIFT_DURATION_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(drift);
    };
  }, [drift]);

  useEffect(() => {
    agitation.value = withTiming(isTriggered ? 1 : 0, { duration: 250 });

    return () => {
      cancelAnimation(agitation);
    };
  }, [agitation, isTriggered]);

  useEffect(() => {
    if (!isTriggered) {
      sinkProgress.value = 0;
      return;
    }

    sinkProgress.value = withTiming(
      sinkDistance,
      { duration: sinkDuration, easing: Easing.linear },
      (finished) => {
        if (finished) {
          scheduleOnRN(notifySinkComplete);
        }
      }
    );

    return () => {
      cancelAnimation(sinkProgress);
    };
  }, [isTriggered, notifySinkComplete, sinkDistance, sinkDuration, sinkProgress]);

  const transformAnimatedStyle = useAnimatedStyle(
    () => ({ opacity: transformOpacity.value }),
    [transformOpacity]
  );

  const loopAnimatedStyle = useAnimatedStyle(
    () => ({ opacity: loopOpacity.value }),
    [loopOpacity]
  );

  const logAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: sinkProgress.value }],
    }),
    [sinkProgress]
  );

  const transformDriftStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: -drift.value * 6 },
        { translateY: -drift.value * 2 },
      ],
    }),
    [drift]
  );

  const centerDriftStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: -drift.value * 5 }],
    }),
    [drift]
  );

  const pulseAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: MUD_PULSE_OPACITY * drift.value,
      transform: [
        { translateX: -drift.value * 12 },
        { translateY: -drift.value * 2 * (1 + agitation.value) },
      ],
    }),
    [drift, agitation]
  );

  const leftEdgeDriftStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: -drift.value * 3 }],
    }),
    [drift]
  );

  const rightEdgeDriftStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: drift.value * 3 }],
    }),
    [drift]
  );

  const logScale = MUD_TRAP_LOG_HEIGHT / LOG_TEXTURE.height;
  const logBoxBottom =
    height - (LOG_TEXTURE.height - LOG_TEXTURE.bottomRow) * logScale;
  const centerWidth = Math.max(0, width - MUD_TRAP_EDGE_WIDTH * 2);
  const tilePadding = 20;
  const centerImageWidth = Math.max(CENTER_TEXTURE.width, centerWidth + tilePadding);
  const transformImageWidth = Math.max(TRANSFORM_TEXTURE.width, width);

  return (
    <View
      pointerEvents="none"
      style={[styles.trapContainer, { left, bottom, width, height }]}
    >
      <Animated.View
        style={[
          styles.mudClip,
          styles.transformLayer,
          transformAnimatedStyle,
          { zIndex: 1 },
        ]}
      >
        <Animated.Image
          source={IMG_MUD_TRANSFORM}
          style={[
            styles.transformImage,
            {
              width: transformImageWidth,
              height: TRANSFORM_TEXTURE.height,
              top: -TRANSFORM_TEXTURE.topRow,
            },
            transformDriftStyle,
          ]}
          resizeMode="repeat"
          fadeDuration={0}
          accessible={false}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.logPlatform,
          {
            left: (width - MUD_TRAP_LOG_WIDTH) / 2,
            bottom: logBoxBottom,
            width: MUD_TRAP_LOG_WIDTH,
            height: MUD_TRAP_LOG_HEIGHT,
            zIndex: 2,
          },
          logAnimatedStyle,
        ]}
      >
        <Image
          source={IMG_LOG}
          style={styles.logImage}
          resizeMode="contain"
          fadeDuration={0}
          accessible={false}
        />
      </Animated.View>

      <Animated.View
        style={[styles.mudClip, styles.frontEdge, loopAnimatedStyle, { zIndex: 3 }]}
      >
        <View style={styles.mudTrenchRow}>
          <View style={[styles.mudEdge, { width: MUD_TRAP_EDGE_WIDTH }]}>
            <Animated.Image
              source={IMG_MUD_EDGE}
              style={[
                styles.edgeImage,
                {
                  width: EDGE_TEXTURE.width,
                  height: EDGE_TEXTURE.height,
                  top: -EDGE_TEXTURE.surfaceRow,
                },
                leftEdgeDriftStyle,
              ]}
              resizeMode="repeat"
              fadeDuration={0}
              accessible={false}
            />
          </View>

          <View style={styles.mudTextureViewport}>
            <Animated.Image
              source={IMG_MUD_CENTER}
              style={[
                styles.centerImage,
                {
                  width: centerImageWidth,
                  height: CENTER_TEXTURE.height,
                  top: -CENTER_TEXTURE.surfaceRow,
                },
                centerDriftStyle,
              ]}
              resizeMode="repeat"
              fadeDuration={0}
              accessible={false}
            />

            <Animated.Image
              source={IMG_MUD_EDGE}
              style={[
                styles.pulseImage,
                {
                  width: Math.max(EDGE_TEXTURE.width, centerWidth + tilePadding),
                  height: EDGE_TEXTURE.height,
                  top: -EDGE_TEXTURE.surfaceRow,
                },
                pulseAnimatedStyle,
              ]}
              resizeMode="repeat"
              fadeDuration={0}
              accessible={false}
            />
          </View>

          <View
            style={[
              styles.mudEdge,
              { width: MUD_TRAP_EDGE_WIDTH, transform: [{ scaleX: -1 }] },
            ]}
          >
            <Animated.Image
              source={IMG_MUD_EDGE}
              style={[
                styles.edgeImage,
                {
                  width: EDGE_TEXTURE.width,
                  height: EDGE_TEXTURE.height,
                  top: -EDGE_TEXTURE.surfaceRow,
                },
                rightEdgeDriftStyle,
              ]}
              resizeMode="repeat"
              fadeDuration={0}
              accessible={false}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  trapContainer: {
    position: 'absolute',
  },
  mudClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  transformLayer: {
    backgroundColor: 'transparent',
  },
  frontEdge: {
    backgroundColor: 'transparent',
  },
  mudTrenchRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  mudEdge: {
    height: '100%',
    overflow: 'hidden',
  },
  edgeImage: {
    position: 'absolute',
    left: 0,
  },
  mudTextureViewport: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  centerImage: {
    position: 'absolute',
    left: 0,
  },
  pulseImage: {
    position: 'absolute',
    left: 0,
  },
  transformImage: {
    position: 'absolute',
    left: 0,
  },
  logPlatform: {
    position: 'absolute',
  },
  logImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
