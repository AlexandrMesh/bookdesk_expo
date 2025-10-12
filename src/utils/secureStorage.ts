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
    console.error('[SecureStorage] Saving token... (length:', token?.length, ')');
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.error('[SecureStorage] Token saved to AsyncStorage (Expo Go)');
    } else {
      // В production build используем SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.error('[SecureStorage] Token saved to SecureStore (Production)');
    }
  } catch (error) {
    console.error('[SecureStorage] Error saving token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    console.error('[SecureStorage] Retrieving token from storage...');
    let token: string | null = null;

    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      token = await AsyncStorage.getItem(TOKEN_KEY);
      console.error('[SecureStorage] Token retrieved from AsyncStorage (Expo Go):', !!token, token ? `(length: ${token.length})` : '');
    } else {
      // В production build используем SecureStore
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      console.error('[SecureStorage] Token retrieved from SecureStore (Production):', !!token, token ? `(length: ${token.length})` : '');
    }

    return token;
  } catch (error) {
    console.error('[SecureStorage] Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    console.error('[SecureStorage] Removing token from storage...');
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.error('[SecureStorage] Token removed from AsyncStorage (Expo Go)');
    } else {
      // В production build используем SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.error('[SecureStorage] Token removed from SecureStore (Production)');
    }
  } catch (error) {
    console.error('[SecureStorage] Error removing token:', error);
    throw error;
  }
};
