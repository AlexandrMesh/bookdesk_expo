import { createAsyncThunk } from '@reduxjs/toolkit';

import { AppThunkAPI } from '~redux/store/configureStore';
import { initDatabase, loadProfile, saveProfile } from '~utils/boardStorage';

const PREFIX = 'APP';

export const supportApp = createAsyncThunk(`${PREFIX}/supportApp`, async (confirmed: boolean, _thunkAPI: AppThunkAPI) => {
  try {
    await initDatabase();
    const profile = await loadProfile();
    const viewedAt = Date.now();

    if (profile) {
      await saveProfile({
        ...profile,
        supportApp: {
          confirmed,
          viewedAt,
        },
      });
    }
    return {
      confirmed,
      viewedAt,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});
