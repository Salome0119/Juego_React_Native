import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ScoreTextProps {
  score: number;
  label?: string;
  style?: object;
}

export const ScoreText: React.FC<ScoreTextProps> = ({
  score,
  label = 'PUNTOS',
  style,
}) => {
  return (
    <Text style={[styles.score, style]}>
      {score}
      <Text style={styles.label}>{`\n${label}`}</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  score: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  label: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
