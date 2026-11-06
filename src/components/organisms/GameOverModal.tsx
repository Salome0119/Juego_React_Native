import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../atoms/Button';
import { COLORS } from '../../constants/theme';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  bestScore?: number;
  onRestart: () => void;
  onExit?: () => void;
}

const Medal: React.FC = () => {
  return (
    <View style={styles.medal}>
      <View style={styles.medalRibbonLeft} />
      <View style={styles.medalRibbonRight} />
      <View style={styles.medalDisc}>
        <Text style={styles.medalStar}>★</Text>
      </View>
    </View>
  );
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  score,
  bestScore = 0,
  onRestart,
  onExit,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRestart}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerHighlight} />
            <Text style={styles.title}>¡Game Over!</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.bodyGlow} />

            <Text style={styles.label}>Puntuación</Text>
            <Text style={styles.score}>{score}</Text>

            <View style={styles.recordRow}>
              <Medal />
              <View>
                <Text style={styles.recordLabel}>Récord</Text>
                <Text style={styles.recordValue}>{bestScore}</Text>
              </View>
            </View>

            <View style={styles.buttonWrapper}>
              <Button title="Reintentar" onPress={onRestart} />
            </View>

            {onExit ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver al inicio"
                onPress={onExit}
                style={styles.exitButton}
              >
                <Text style={styles.exitText}>Volver al inicio</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: COLORS.text,
    backgroundColor: '#fff4d6',
    overflow: 'hidden',
    shadowColor: COLORS.textShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f48c06',
    borderBottomWidth: 4,
    borderBottomColor: '#d97706',
  },
  headerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  bodyGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255, 209, 102, 0.35)',
  },
  label: {
    color: '#8a5a00',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  score: {
    color: '#5a3a00',
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 64,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0b400',
    backgroundColor: '#ffe9ad',
  },
  recordLabel: {
    color: '#8a5a00',
    fontSize: 12,
    fontWeight: '700',
  },
  recordValue: {
    color: '#5a3a00',
    fontSize: 21,
    fontWeight: '900',
  },
  medal: {
    width: 42,
    height: 42,
    alignItems: 'center',
  },
  medalRibbonLeft: {
    position: 'absolute',
    top: 0,
    left: 9,
    width: 8,
    height: 20,
    backgroundColor: '#e63946',
    transform: [{ rotate: '16deg' }],
  },
  medalRibbonRight: {
    position: 'absolute',
    top: 0,
    right: 9,
    width: 8,
    height: 20,
    backgroundColor: '#e63946',
    transform: [{ rotate: '-16deg' }],
  },
  medalDisc: {
    position: 'absolute',
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4a017',
    backgroundColor: '#ffd166',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalStar: {
    color: '#b8860b',
    fontSize: 17,
    fontWeight: '900',
  },
  buttonWrapper: {
    marginTop: 18,
  },
  exitButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  exitText: {
    color: '#8a5a00',
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
