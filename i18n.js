import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import sv from './locales/sv.json';

export const LANGUAGE_KEY = 'userLanguage';

function deviceLanguage() {
  const code = Localization.getLocales?.()?.[0]?.languageCode;
  return code === 'sv' ? 'sv' : 'en';
}

const resources = {
  en: { translation: en },
  sv: { translation: sv },
};

// Synk init vid import (krävs när entry är expo/AppEntry.js — ingen async före registerRootComponent).
// compatibilityJSON: 'v3' undviker pluralResolver-fel i RN med enkla JSON-nycklar.
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
  react: {
    useSuspense: false,
  },
});

/** Läs sparad språkpreference (överstyr enhet efter första frame). */
export async function hydrateI18nLanguage() {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    const lng = stored === 'en' || stored === 'sv' ? stored : deviceLanguage();
    if (lng !== i18n.language) {
      await i18n.changeLanguage(lng);
    }
  } catch {
    await i18n.changeLanguage(deviceLanguage());
  }
}

export async function setAppLanguage(lang) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
