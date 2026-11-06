import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f48c06',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 5,
  },
  text: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});