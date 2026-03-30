import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJson(key, fallbackValue) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export async function saveJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function appendUniqueString(key, value) {
  const list = await loadJson(key, []);
  if (!Array.isArray(list)) {
    await saveJson(key, [value]);
    return [value];
  }
  if (!list.includes(value)) {
    const updated = [...list, value];
    await saveJson(key, updated);
    return updated;
  }
  return list;
}
