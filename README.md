# MuuDash
Juego de plataformas 2D desarrollado con React Native + Expo. La vaquita corre, salta, dispara y vuela por cuatro niveles con obstáculos, jefes y mecánicas propias. Funciona en **Expo Go (Android/iOS)** y en **navegador (React Native Web)**.

## Tecnologías

- Expo SDK 57 / React Native 0.86
- React 19 + TypeScript 6
- react-native-reanimated 4 + react-native-worklets
- react-native-safe-area-context
- expo-screen-orientation (bloqueo horizontal)
- react-native-web
- ESLint (`eslint-config-expo`)

## Requisitos

- Node.js 20+
- npm
- App Expo Go o emulador/dispositivo, y navegador para la versión web

## Instalación

```bash
npm install
npm start
En el menú de Expo elige:
- a → Android / Expo Go
- i → iOS / Expo Go
- w → navegador
Scripts disponibles:
npm run android     # expo start --android
npm run ios         # expo start --ios
npm run web         # expo start --web
npm run lint        # npx expo lint
npx tsc --noEmit    # comprobación de tipos
Controles
Acción	Móvil
Avanzar / retroceder	Botones ‹ ›
Saltar / subir	Botón ↑
Bajar / inclinarse (niveles 3-4)	Botón ↓
Disparar	Botón F
Armería	Tocar el HUD superior derecho
Los controles usan Pressable con hitSlop, multitouch y estados en useRef, por lo que puedes mantener pulsado para avanzar mientras saltas o disparas.
Niveles
1. Praderas — cajas, pinchos, trampas, minijefes y portal al Nivel 2.
2. Ruta alta — escaleras, plataformas flotantes, murciélagos y persecución.
3. Mundo submarino — pulpos, erizos, dragón jefe y portal.
4. Vuelo — vaquita con alas, pájaros, tormenta con aviso de 2 s, tres portales aleatorios (jefe / mundo marino / Nivel 1), gárgola final, esferas azules de daño y portal al Nivel 5.
La pantalla permanece en horizontal (landscape) y los fondos cubren todo el viewport en móvil y web.
Estructura
assets/                     imágenes, fondos y sprites
src/
  screens/
    HomeScreen.tsx          pantalla inicial
    GameScreen.tsx          bucle de juego y niveles
  components/
    atoms/                  vaquita, enemigos, portales, gárgola…
    molecules/              controles táctiles, HUD, selector DEV
    organisms/              modales y elementos de escena
  constants/
    theme.ts                colores y hook de dimensiones
    debug.ts                selector rápido de nivel
App.tsx                     navegación entre inicio y partida
index.ts                    registro de la app Expo
Depuración
Existe un selector temporal DEV en pantalla para entrar directamente a los niveles 1-4. Se activa/desactiva con SHOW_DEBUG_LEVEL_SELECTOR en src/constants/debug.ts. Al cambiar de nivel se incrementa resetKey, por lo que se reinician timers, entradas y estado del personaje.
Notas
Si npx expo-doctor avisa de versiones, ejecuta npx expo install --fix antes de generar builds.
