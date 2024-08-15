import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import sv from './locales/sv.json';

const translations = {
  en: en,
  sv: sv
};

let currentLanguage = 'sv';

export const setLanguage = async (lang) => {
  currentLanguage = lang;
  await AsyncStorage.setItem('language', lang);
};

export const getTranslation = (key) => {
  return translations[currentLanguage][key] || key;
};

export const loadLanguage = async () => {
  const lang = await AsyncStorage.getItem('language');
  if (lang) {
    currentLanguage = lang;
  }
};

export default {
  setLanguage,
  getTranslation,
  loadLanguage
};
