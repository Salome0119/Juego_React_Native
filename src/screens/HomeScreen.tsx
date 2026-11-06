import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Cow } from '../components/atoms/Cow';
import { Button } from '../components/atoms/Button';
import { COLORS, SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/theme';

interface HomeScreenProps {
  onStartGame: () => void;
}

interface CloudProps {
  top: number;
  left: number;
  scale?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
}

const Cloud: React.FC<CloudProps> = ({
  top,
  left,
  scale = 1,
  duration = 5000,
  delay = 0,
  opacity = 0.85,
}) => {
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const timer = setTimeout(() => animation.start(), delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [drift, duration, delay]);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  return (
    <Animated.View
      style={[styles.cloud, { top, left, opacity, transform: [{ translateX }, { scale }] }]}
    >
      <View style={[styles.cloudPuff, styles.cloudPuffSmall]} />
      <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
      <View style={[styles.cloudPuff, styles.cloudPuffMedium]} />
    </Animated.View>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  return (
    <View style={styles.container}>
      <Cloud top={70} left={-20} duration={5200} />
      <Cloud top={148} left={SCREEN_WIDTH - 92} scale={0.8} duration={4400} delay={500} opacity={0.75} />
      <Cloud top={SCREEN_HEIGHT * 0.3} left={20} scale={0.65} duration={6200} delay={1100} opacity={0.6} />
      <Cloud
        top={SCREEN_HEIGHT - 190}
        left={SCREEN_WIDTH - 134}
        scale={1.1}
        duration={4800}
        delay={300}
        opacity={0.7}
      />

      <View style={styles.content}>
        <View style={styles.mascot}>
          <Cow width={150} height={118} rotation={-8} />
        </View>

        <View style={styles.titlePanel}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            Vaca Aventurera
          </Text>
        </View>

        <Text style={styles.subtitle}>
          Corre, salta y esquiva los obstáculos con los controles
        </Text>

        <View style={styles.buttonWrapper}>
          <Button title="Iniciar Juego" onPress={onStartGame} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 20,
    zIndex: 1,
  },
  cloud: {
    position: 'absolute',
    width: 96,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.text,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: COLORS.text,
  },
  cloudPuffSmall: {
    left: 12,
    top: -12,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  cloudPuffLarge: {
    left: 34,
    top: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  cloudPuffMedium: {
    right: 8,
    top: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  mascot: {
    width: 160,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titlePanel: {
    borderWidth: 4,
    borderColor: COLORS.text,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    shadowColor: COLORS.textShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 9,
  },
  title: {
    color: COLORS.bird,
    fontSize: 46,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  buttonWrapper: {
    marginTop: 12,
  },
});
