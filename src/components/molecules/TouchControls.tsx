import React, { useCallback, useRef } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, useScreenDimensions } from '../../constants/theme';

interface ControlPressableProps {
  onActivate: () => void;
  onDeactivate?: () => void;
  style: PressableProps['style'];
  accessibilityLabel?: string;
  hitSlop?: PressableProps['hitSlop'];
  children: React.ReactNode;
}

const ControlPressable: React.FC<ControlPressableProps> = ({
  onActivate,
  onDeactivate,
  style,
  accessibilityLabel,
  hitSlop,
  children,
}) => {
  const pointersRef = useRef(new Set<string>());
  const activeRef = useRef(false);

  const activate = useCallback(() => {
    if (activeRef.current) {
      return;
    }
    activeRef.current = true;
    onActivate();
  }, [onActivate]);

  const deactivate = useCallback(() => {
    if (!activeRef.current) {
      return;
    }
    activeRef.current = false;
    onDeactivate?.();
  }, [onDeactivate]);

  const handlePressIn = useCallback(() => {
    activate();
  }, [activate]);

  const handlePressOut = useCallback(() => {
    if (pointersRef.current.size === 0) {
      deactivate();
    }
  }, [deactivate]);

  const handleTouch = useCallback(
    (event: GestureResponderEvent, isStart: boolean) => {
      const touches = event.nativeEvent.changedTouches ?? [];
      for (const touch of touches) {
        if (isStart) {
          pointersRef.current.add(touch.identifier);
        } else {
          pointersRef.current.delete(touch.identifier);
        }
      }
      if (isStart) {
        activate();
      } else if (pointersRef.current.size === 0) {
        deactivate();
      }
    },
    [activate, deactivate]
  );

  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => handleTouch(event, true),
    [handleTouch]
  );
  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => handleTouch(event, false),
    [handleTouch]
  );
  const handleTouchCancel = useCallback(
    (event: GestureResponderEvent) => handleTouch(event, false),
    [handleTouch]
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      cancelable={false}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      hitSlop={hitSlop ?? { top: 10, bottom: 10, left: 10, right: 10 }}
      style={style}
    >
      {children}
    </Pressable>
  );
};

interface TouchControlsProps {
  disabled?: boolean;
  onLeftPressIn: () => void;
  onLeftPressOut: () => void;
  onRightPressIn: () => void;
  onRightPressOut: () => void;
  onJumpPressIn: () => void;
  onJumpPressOut?: () => void;
  onDownPressIn?: () => void;
  onDownPressOut?: () => void;
  showDown?: boolean;
  onShootPressIn: () => void;
  onShootPressOut?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  disabled,
  onLeftPressIn,
  onLeftPressOut,
  onRightPressIn,
  onRightPressOut,
  onJumpPressIn,
  onJumpPressOut,
  onDownPressIn,
  onDownPressOut,
  showDown = false,
  onShootPressIn,
  onShootPressOut,
}) => {
  const { width, height } = useScreenDimensions();
  const insets = useSafeAreaInsets();
  const buttonScale = Math.min(
    1.15,
    Math.max(0.92, Math.min((height - 90) / 360, width / 520))
  );
  const moveSize = Math.round(Math.max(60, Math.min(76, 68 * buttonScale)));
  const jumpSize = Math.round(moveSize * 1.35);
  const gap = Math.max(12, Math.round(moveSize * 0.22));
  const arrowFontSize = Math.round(26 * buttonScale);
  const horizontalPadding = Math.round(12 * buttonScale);

  return (
    <View
      pointerEvents={disabled ? 'none' : 'box-none'}
      style={[
        styles.container,
        {
          paddingLeft: insets.left + horizontalPadding,
          paddingRight: insets.right + horizontalPadding,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <View pointerEvents="box-none" style={[styles.leftGroup, { gap }]}>
        <ControlPressable
          accessibilityLabel="Izquierda"
          onActivate={onLeftPressIn}
          onDeactivate={onLeftPressOut}
          style={({ pressed }) => [
            styles.circleButton,
            styles.moveButton,
            { width: moveSize, height: moveSize, borderRadius: moveSize / 2 },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.arrow, { fontSize: arrowFontSize }]}>{'<'}</Text>
        </ControlPressable>
        <ControlPressable
          accessibilityLabel="Derecha"
          onActivate={onRightPressIn}
          onDeactivate={onRightPressOut}
          style={({ pressed }) => [
            styles.circleButton,
            styles.moveButton,
            { width: moveSize, height: moveSize, borderRadius: moveSize / 2 },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.arrow, { fontSize: arrowFontSize }]}>{'>'}</Text>
        </ControlPressable>
        {showDown && (
          <ControlPressable
            accessibilityLabel="Abajo"
            onActivate={onDownPressIn ?? (() => {})}
            onDeactivate={onDownPressOut}
            style={({ pressed }) => [
              styles.circleButton,
              styles.downButton,
              { width: moveSize, height: moveSize, borderRadius: moveSize / 2 },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.arrow, { fontSize: arrowFontSize }]}>{'↓'}</Text>
          </ControlPressable>
        )}
      </View>

      <View pointerEvents="box-none" style={[styles.rightGroup, { gap }]}>
        <ControlPressable
          accessibilityLabel="Disparar"
          onActivate={onShootPressIn}
          onDeactivate={onShootPressOut}
          style={({ pressed }) => [
            styles.circleButton,
            styles.shootButton,
            { width: moveSize, height: moveSize, borderRadius: moveSize / 2 },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text
            style={[styles.shootText, { fontSize: Math.round(22 * buttonScale) }]}
          >
            F
          </Text>
        </ControlPressable>
        <ControlPressable
          accessibilityLabel="Salto"
          onActivate={onJumpPressIn}
          onDeactivate={onJumpPressOut}
          style={({ pressed }) => [
            styles.circleButton,
            styles.jumpButton,
            { width: jumpSize, height: jumpSize, borderRadius: jumpSize / 2 },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.jumpArrow,
              {
                fontSize: Math.round(28 * buttonScale),
                lineHeight: Math.round(30 * buttonScale),
              },
            ]}
          >
            {'↑'}
          </Text>
          <Text
            style={[
              styles.jumpLabel,
              { fontSize: Math.max(8, Math.round(10 * buttonScale)) },
            ]}
          >
            SALTO
          </Text>
        </ControlPressable>
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
    zIndex: 100,
    elevation: 100,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  rightGroup: {
    position: 'relative',
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
  downButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: 'rgba(160, 240, 255, 0.95)',
    backgroundColor: 'rgba(40, 150, 190, 0.35)',
    shadowColor: '#7fe8ff',
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
