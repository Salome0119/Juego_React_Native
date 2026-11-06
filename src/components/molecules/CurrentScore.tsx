import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

interface CurrentScoreProps {
  score: number;
}

export const CurrentScore: React.FC<CurrentScoreProps> = ({ score }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score}</Text>
      <Text style={styles.label}>PUNTOS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(12, 40, 58, 0.45)',
    borderWidth: 3,
    borderColor: COLORS.text,
    shadowColor: COLORS.textShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  scoreText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  label: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
