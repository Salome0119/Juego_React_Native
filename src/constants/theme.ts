import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  primary: '#70c5ce', // Color del cielo
  ground: '#d88b33',  // Color del suelo
  pipe: '#73bf2e',    // Color de las tuberías
  bird: '#f8e71c',    // Color del pájaro
  text: '#ffffff',
  textShadow: '#000000',
};