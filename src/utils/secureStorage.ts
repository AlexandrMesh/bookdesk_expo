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
      console.log('Token saved to AsyncStorage (Expo Go)');
    } else {
      // В production build используем SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('Token saved to SecureStore (Production)');
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;
    
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('Token retrieved from AsyncStorage (Expo Go):', !!token);
    } else {
      // В production build используем SecureStore
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      console.log('Token retrieved from SecureStore (Production):', !!token);
    }
    
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    if (isExpoGo) {
      // В Expo Go используем AsyncStorage
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('Token removed from AsyncStorage (Expo Go)');
    } else {
      // В production build используем SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('Token removed from SecureStore (Production)');
    }
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};

