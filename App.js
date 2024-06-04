import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default function App() {
  const [streakCount, setStreakCount] = useState(0);
  const [lastRunDate, setLastRunDate] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastRunDate !== today) {
      setLastRunDate(today);
    }
  }, [lastRunDate]);

  const handleAddDay = () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastRunDate === today) {
      Alert.alert('Du har redan loggat en dag idag.');
    } else {
      setStreakCount(streakCount + 1);
      setLastRunDate(today);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Runstreak App</Text>
      <Text style={styles.streak}>Du har en runstreak på:</Text>
      <Text style={styles.streakCount}>{streakCount} dagar</Text>
      <Button title="Lägg till en dag" onPress={handleAddDay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  streak: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
