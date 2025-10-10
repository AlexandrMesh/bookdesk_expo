import { createAsyncThunk } from '@reduxjs/toolkit';

import AppService from '~http/services/app';
import { AppThunkAPI } from '~redux/store/configureStore';

const PREFIX = 'APP';

export const supportApp = createAsyncThunk(`${PREFIX}/supportApp`, async (confirmed: boolean, _thunkAPI: AppThunkAPI) => {
  try {
    const { data } = (await AppService().supportApp({ confirmed })) || {};
    return {
      confirmed,
      viewedAt: data?.supportApp?.viewedAt,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});
