import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

interface TouchControlsProps {
  disabled?: boolean;
  onLeftPressIn: () => void;
  onLeftPressOut: () => void;
  onRightPressIn: () => void;
  onRightPressOut: () => void;
  onJumpPressIn: () => void;
  onShootPressIn: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  disabled,
  onLeftPressIn,
  onLeftPressOut,
  onRightPressIn,
  onRightPressOut,
  onJumpPressIn,
  onShootPressIn,
}) => {
  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} style={styles.container}>
      <View style={styles.leftGroup}>
        <Pressable
          onPressIn={onLeftPressIn}
          onPressOut={onLeftPressOut}
          style={({ pressed }) => [styles.circleButton, styles.moveButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.arrow}>{'<'}</Text>
        </Pressable>
        <Pressable
          onPressIn={onRightPressIn}
          onPressOut={onRightPressOut}
          style={({ pressed }) => [styles.circleButton, styles.moveButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.arrow}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.rightGroup}>
        <Pressable
          onPressIn={onShootPressIn}
          style={({ pressed }) => [styles.circleButton, styles.shootButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.shootText}>F</Text>
        </Pressable>
        <Pressable
          onPressIn={onJumpPressIn}
          style={({ pressed }) => [styles.circleButton, styles.jumpButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.jumpArrow}>{'↑'}</Text>
          <Text style={styles.jumpLabel}>SALTO</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 20,
    elevation: 20,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  circleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  moveButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#8fe9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 10,
  },
  shootButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: 'rgba(255, 220, 180, 0.95)',
    backgroundColor: 'rgba(255, 150, 70, 0.30)',
    shadowColor: '#ff9b4a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  jumpButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(120, 220, 255, 0.22)',
    shadowColor: '#9be8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  },
  buttonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  arrow: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
  },
  shootText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  jumpArrow: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  jumpLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '900',
  },
});
