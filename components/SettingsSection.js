import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function SettingsSection({ title, darkTheme }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, darkTheme && styles.titleDark]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#5c6bc0',
  },
  titleDark: {
    color: '#9fa8da',
  },
});
