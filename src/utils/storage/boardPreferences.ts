import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDDEN_BOARDS_KEY = 'hiddenBoards';

export const saveHiddenBoards = async (hiddenBoards: string[]) => {
  try {
    await AsyncStorage.setItem(HIDDEN_BOARDS_KEY, JSON.stringify(hiddenBoards));
  } catch (error) {
    console.error('Error saving hidden boards:', error);
  }
};

export const loadHiddenBoards = async (): Promise<string[]> => {
  try {
    const value = await AsyncStorage.getItem(HIDDEN_BOARDS_KEY);
    if (value) {
      const parsed = JSON.parse(value);
      // Validate that it's an array of strings
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string');
      }
    }
    return [];
  } catch (error) {
    console.error('Error loading hidden boards:', error);
    return [];
  }
};

export const clearHiddenBoards = async () => {
  try {
    await AsyncStorage.removeItem(HIDDEN_BOARDS_KEY);
  } catch (error) {
    console.error('Error clearing hidden boards:', error);
  }
};

