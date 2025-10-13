import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const FIRST_OPEN_KEY = 'rp:firstOpenAt';
const OPENS_COUNT_KEY = 'rp:opensCount';
const LAST_PROMPT_AT_KEY = 'rp:lastPromptAt';
const HAS_REVIEWED_KEY = 'rp:hasReviewed';
// Debug mode removed for production readiness

const MS_IN_DAY = 24 * 60 * 60 * 1000;

type MaybeAskForReviewOptions = {
  minOpens?: number;
  minDaysSinceFirstOpen?: number;
  minDaysBetweenPrompts?: number;
};

export const recordAppOpen = async (): Promise<void> => {
  // Save first open date
  const firstOpen = await AsyncStorage.getItem(FIRST_OPEN_KEY);
  if (!firstOpen) {
    await AsyncStorage.setItem(FIRST_OPEN_KEY, String(Date.now()));
  }

  // Increment opens counter
  const opensRaw = await AsyncStorage.getItem(OPENS_COUNT_KEY);
  const opensCount = Number(opensRaw || '0') + 1;
  await AsyncStorage.setItem(OPENS_COUNT_KEY, String(opensCount));
};

export const maybeAskForReview = async (options?: MaybeAskForReviewOptions): Promise<boolean | void> => {
  const { minOpens = 5, minDaysSinceFirstOpen = 3, minDaysBetweenPrompts = 7 } = options || {};
  const available = await StoreReview.isAvailableAsync();
  if (!available) return false;

  const hasReviewed = (await AsyncStorage.getItem(HAS_REVIEWED_KEY)) === '1';
  if (hasReviewed) return false;

  const opens = Number((await AsyncStorage.getItem(OPENS_COUNT_KEY)) || '0');
  const firstOpenAt = Number((await AsyncStorage.getItem(FIRST_OPEN_KEY)) || '0');
  const lastPromptAt = Number((await AsyncStorage.getItem(LAST_PROMPT_AT_KEY)) || '0');

  const daysSinceFirstOpen = firstOpenAt ? (Date.now() - firstOpenAt) / MS_IN_DAY : 0;
  const daysSinceLastPrompt = lastPromptAt ? (Date.now() - lastPromptAt) / MS_IN_DAY : Infinity;

  const meetsOpenCount = opens >= minOpens;
  const meetsFirstOpenDays = daysSinceFirstOpen >= minDaysSinceFirstOpen;
  const meetsBetweenPrompts = daysSinceLastPrompt >= minDaysBetweenPrompts;

  if (!meetsOpenCount || !meetsFirstOpenDays || !meetsBetweenPrompts) return false;

  const didRequest = (await StoreReview.requestReview()) as boolean | undefined;
  // Mark prompt time regardless of result to avoid spamming
  await AsyncStorage.setItem(LAST_PROMPT_AT_KEY, String(Date.now()));

  // Try to detect if user reviewed on iOS (Android returns boolean inconsistently)
  if (didRequest === true) {
    await AsyncStorage.setItem(HAS_REVIEWED_KEY, '1');
  }

  return didRequest;
};

// Force show review prompt regardless of thresholds (for manual testing)
export const requestReviewNow = async (): Promise<boolean | void> => {
  const available = await StoreReview.isAvailableAsync();
  if (!available) return false;
  const did = await StoreReview.requestReview();
  await AsyncStorage.setItem(LAST_PROMPT_AT_KEY, String(Date.now()));
  return did;
};

// Reset local review state (for testing cycles)
export const resetReviewPromptState = async (): Promise<void> => {
  await AsyncStorage.multiRemove([FIRST_OPEN_KEY, OPENS_COUNT_KEY, LAST_PROMPT_AT_KEY, HAS_REVIEWED_KEY]);
};

// Debug enable/disable removed
