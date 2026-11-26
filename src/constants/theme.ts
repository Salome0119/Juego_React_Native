import { Dimensions, useWindowDimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const useScreenDimensions = () => {
  const { width: currentWidth, height: currentHeight } =
    useWindowDimensions();
  return {
    width: currentWidth || SCREEN_WIDTH,
    height: currentHeight || SCREEN_HEIGHT,
  };
};

export const COLORS = {
  primary: '#70c5ce', // Color del cielo
  ground: '#d88b33', // Color del suelo
  pipe: '#73bf2e', // Color de las tuberías
  bird: '#f8e71c', // Color del pájaro
  text: '#ffffff',
  textShadow: '#000000',
};
