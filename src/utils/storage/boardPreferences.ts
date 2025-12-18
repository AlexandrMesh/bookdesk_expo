import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDDEN_BOARDS_KEY = 'hiddenBoards';
const BOARD_ORDER_KEY = 'boardOrder';

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

export const saveBoardOrder = async (boardOrder: string[]) => {
  try {
    await AsyncStorage.setItem(BOARD_ORDER_KEY, JSON.stringify(boardOrder));
  } catch (error) {
    console.error('Error saving board order:', error);
  }
};

export const loadBoardOrder = async (): Promise<string[]> => {
  try {
    const value = await AsyncStorage.getItem(BOARD_ORDER_KEY);
    if (value) {
      const parsed = JSON.parse(value);
      // Validate that it's an array of strings
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string');
      }
    }
    return [];
  } catch (error) {
    console.error('Error loading board order:', error);
    return [];
  }
};

export const clearBoardOrder = async () => {
  try {
    await AsyncStorage.removeItem(BOARD_ORDER_KEY);
  } catch (error) {
    console.error('Error clearing board order:', error);
  }
};

