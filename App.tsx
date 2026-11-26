import React, { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AppState, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [initialLevel, setInitialLevel] = useState(1);

  useEffect(() => {
    const lockLandscape = () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => undefined);
    };

    lockLandscape();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        lockLandscape();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {isPlaying ? (
          <GameScreen
            key={sessionId}
            initialLevel={initialLevel}
            onExit={() => setIsPlaying(false)}
            onRestartSession={() => setSessionId((current) => current + 1)}
            onLevelChange={setInitialLevel}
          />
        ) : (
          <HomeScreen
            onStartGame={() => {
              setInitialLevel(1);
              setSessionId((current) => current + 1);
              setIsPlaying(true);
            }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});