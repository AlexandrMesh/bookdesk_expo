import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { DAILY } from '~constants/goals';
import { clearBooksData } from '~redux/actions/booksActions';
import { clearData as clearCustomBooksData } from '~redux/actions/customBookActions';
import { clearData as clearGoalsData, setGoal } from '~redux/actions/goalsActions';
import { clearData as clearStatisticData } from '~redux/actions/statisticActions';
import { IProfile } from '~types/auth';
import { initDatabase, loadProfile, resetAllDatabaseData, saveGuestProfile, saveProfile, setSyncDatabaseCompleted } from '~utils/boardStorage';
import { removeToken } from '~utils/secureStorage';

const PREFIX = 'AUTH';

export const initializationComplete = createAction<{ profile: IProfile | null; isSignedIn: boolean }>(`${PREFIX}/initializationComplete`);

export const resetData = createAsyncThunk(`${PREFIX}/resetData`, async (_, { dispatch }) => {
  try {
    await initDatabase();

    try {
      await removeToken();
      // eslint-disable-next-line no-console
      console.log('🗑️ [resetData] Токен удален');
    } catch (error) {
      console.error('Error removing token:', error);
    }

    await resetAllDatabaseData();

    dispatch(clearBooksData());
    dispatch(clearCustomBooksData());
    dispatch(clearStatisticData());
    dispatch(clearGoalsData());
    dispatch(setGoal({ pages: 0, type: DAILY }));

    await saveGuestProfile(true);
    await setSyncDatabaseCompleted(false);

    const newProfile = await loadProfile();
    if (newProfile) {
      await saveProfile({ ...newProfile, syncDatabaseCompleted: false });
      dispatch(initializationComplete({ profile: newProfile, isSignedIn: false }));
    } else {
      dispatch(initializationComplete({ profile: null, isSignedIn: false }));
    }

    // eslint-disable-next-line no-console
    console.log('✅ [resetData] Все данные приложения сброшены, создан новый гостевой пользователь');
  } catch (error) {
    console.error('Error resetting data:', error);
    throw error;
  }
});
