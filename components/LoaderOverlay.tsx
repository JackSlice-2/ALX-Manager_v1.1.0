// LoaderOverlay.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import RobotoText from './RobotoText';

type LoaderOverlayProps = {
  visible: boolean;
  message?: string;
};

export default function LoaderOverlay({ visible, message }: LoaderOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#00f" />
      {message && <RobotoText style={styles.message}>{message}</RobotoText>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  message: {
    color: '#000000ff',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
