import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeMode } from '~theme/types';

const THEME_MODE_KEY = 'themeMode';

export const saveThemeMode = async (mode: ThemeMode) => {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  } catch (error) {
    console.error('Error saving theme mode:', error);
  }
};

export const loadThemeMode = async (): Promise<ThemeMode | null> => {
  try {
    const value = await AsyncStorage.getItem(THEME_MODE_KEY);
    if (value === 'auto' || value === 'light' || value === 'dark') {
      return value;
    }
    return null;
  } catch (error) {
    console.error('Error loading theme mode:', error);
    return null;
  }
};

