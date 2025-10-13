import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Безопасное хранилище токенов
 * Использует SecureStore в production build и AsyncStorage в Expo Go
 */

const TOKEN_KEY = 'token';

const isExpoGo = Constants.appOwnership === 'expo';

export const saveToken = async (token: string): Promise<void> => {
  try {
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      // В production build используем SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      // Удаляем возможный legacy-токен из AsyncStorage, чтобы избежать дублирования
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      return await AsyncStorage.getItem(TOKEN_KEY);
    }

    // В production: сначала пытаемся прочитать из SecureStore
    const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (secureToken) {
      return secureToken;
    }

    // Backward compatibility: если токен хранится в AsyncStorage у существующих пользователей
    const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      // Мигрируем в SecureStore и удаляем из AsyncStorage
      await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(TOKEN_KEY);
      return legacyToken;
    }

    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    // Удаляем из обоих хранилищ на всякий случай (для надёжности и обратной совместимости)
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), SecureStore.deleteItemAsync(TOKEN_KEY)]);
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};
