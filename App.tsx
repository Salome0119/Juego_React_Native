import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { COLORS } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  const [isSkiaReady, setIsSkiaReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setIsSkiaReady(true);
      }
    }, 10000);
    LoadSkiaWeb({
      locateFile: (file) => `/${file}`,
    }).then(() => {
      settled = true;
      clearTimeout(timer);
      setIsSkiaReady(true);
    }).catch((err) => {
      console.error('Error al inicializar Skia Web:', err);
      settled = true;
      clearTimeout(timer);
      setIsSkiaReady(true);
    });
    return () => clearTimeout(timer);
  }, []);

  if (!isSkiaReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Iniciando motor gráfico...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {isPlaying ? (
          <GameScreen onExit={() => setIsPlaying(false)} />
        ) : (
          <HomeScreen onStartGame={() => setIsPlaying(true)} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});