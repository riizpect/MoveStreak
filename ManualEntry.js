import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ManualEntry({ navigation }) {
  const [distance, setDistance] = useState('');
  const [date, setDate] = useState(new Date().toDateString());

  const handleSave = async () => {
    if (!distance) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    const runEntry = {
      distance: parseFloat(distance),
      date,
    };

    try {
      const storedRuns = await AsyncStorage.getItem('manualRuns');
      const runs = storedRuns ? JSON.parse(storedRuns) : [];
      runs.push(runEntry);
      await AsyncStorage.setItem('manualRuns', JSON.stringify(runs));
      Alert.alert('Success', 'Run registered successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save the run');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Distance (km):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={distance}
        onChangeText={setDistance}
      />
      <Text style={styles.label}>Date: {date}</Text>
      <Button title="Save Run" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
});
